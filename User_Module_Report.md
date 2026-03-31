# Rapport Technique Complet : Module "User" (Backend & DB)

## 1. Introduction

Ce rapport présente une analyse exhaustive et strictement technique de la gestion des utilisateurs (`user`) au sein du backend du projet Kredia. Ce document détaille l'architecture en couches (Controllers, Services, Repositories), l'implémentation de la logique métier, la sécurisation des endpoints, le suivi des journaux d'audit (UserActivity), les structures de données en base, ainsi que toutes les opérations CRUD et fonctionnelles liées au domaine `user`. Le rapport exclut volontairement toute partie frontend.

---

## 2. Architecture Globale

Le module `user` est bâti sur une architecture classique Spring Boot (MVC) stricte et orientée domaine :

- **Entities (`com.kredia.entity.user`) :** Entités JPA représentant le modèle de données : `User` (avec Soft-Delete, Optimistic Locking, et Auditing JPA) et `UserActivity` (journal d'événements), associées aux énumérations `UserRole`, `UserStatus` et `UserActivityActionType`.
- **Repositories (`com.kredia.repository.user`) :** Interfaces Spring Data JPA (`UserRepository`, `UserActivityRepository`) incluant des spécifications dynamiques (`UserSpecifications`) pour la recherche avancée.
- **DTOs (`com.kredia.dto.user`) :** Modèles d'échange de données (Request et Response) permettant le découplage, munis d'annotations de validation (`@NotBlank`, `@Email`, etc.). `ApiResponse` emballe mondialement ces DTOs.
- **Services (`com.kredia.service.user` & `impl.user`) :** `UserService` (interface) et `UserServiceImpl`. L'implémentation gère **intégralement** la logique métier transversale (contrôle RBAC en service, invariants, génération de scores et traçabilité d'audit).
- **Controllers (`com.kredia.controller.user`) :** `UserController`. Expose les API REST sous `/api/user`. Délègue à 100% l'exécution de la logique au `UserService`.
- **Exceptions & Config :** Interception centralisée (`GlobalExceptionHandler`) traduisant les `BusinessException`, `ResourceNotFoundException`, et `ForbiddenException` en structures JSON standards. Validation globale avec l'annotation `@Valid`.

---

## 3. Analyse Détaillée par Fonctionnalité

Cette section détaille chaque méthode du cycle de vie du "user". 

### 3.1. Create User
- **Nom :** Création d'Utilisateur
- **Type :** CRUD (Create)
- **Description :** Enregistre un nouvel utilisateur en base en vérifiant l'absence de doublons (email/téléphone) et en forçant par défaut l'état "en attente" avec le rôle "client".
- **Endpoint API :** `POST /api/user`
  - **Paramètres (Body) :** `UserRequestDTO` (email, firstName, lastName, phoneNumber)
  - **Réponse :** HTTP 201 Created -> `ApiResponse<UserResponseDTO>`
- **Calculs/Transformations :**
  - Mappe le DTO vers l'entité `User`.
  - Force explicitement : `status = PENDING_VERIFICATION`, `role = CLIENT`, `deleted = false`, `emailVerified = false`, `id = null`.
- **Règles métier :**
  - Validation DTO (email valide, pas vide, max caractères).
  - Unicité vérifiée en base (`existsByEmailAndDeletedFalse`, `existsByPhoneNumberAndDeletedFalse`). 
- **DB/Relations :** Insertion dans `users`. Insertion simultanée dans `user_activities`.
- **Cas Spéciaux :** Lève `BusinessException` (400) si l'email ou le téléphone existent déjà parmi les utilisateurs non supprimés.
- **Logs/Audit :** Enregistre un `UserActivity` de type `CREATED` et ajoute un log SLF4J (`user_created userId=...`).

### 3.2. Search Users
- **Nom :** Recherche Pagée et Filtrée
- **Type :** CRUD (Read)
- **Description :** Permet la récupération d'une liste paginée d'utilisateurs avec des filtres optionnels, en ne renvoyant que les utilisateurs non soft-deleted.
- **Endpoint API :** `GET /api/user`
  - **Paramètres :** `email`, `status`, `role`, `createdFrom`, `createdTo`, `page`, `size`
  - **Réponse :** HTTP 200 OK -> `ApiResponse<Page<UserResponseDTO>>`
- **Calculs/Transformations :** Construction dynamique de critères JPA via `UserSpecifications`.
- **Règles métier :** Exclut toujours les utilisateurs marqués comme supprimés (`deleted = true`).
- **DB/Relations :** Jointure non requise, simple requête SQL avec clause `WHERE` dynamique.

### 3.3. Get User By ID
- **Nom :** Lecture d'un Utilisateur
- **Type :** CRUD (Read)
- **Description :** Retourne un utilisateur précis basé sur son ID, erreur si introuvable ou supprimé.
- **Endpoint API :** `GET /api/user/{id}`
  - **Réponse :** HTTP 200 OK -> `ApiResponse<UserResponseDTO>`
- **Règles métier :** Vérifie que l'entité n'est pas "deleted" via le repository (`findByIdAndDeletedFalse`).
- **Cas Spéciaux :** Lève `ResourceNotFoundException` (404) si l'utilisateur n'existe pas ou est soft-deleted.

### 3.4. Update User
- **Nom :** Mise à Jour Utilisateur
- **Type :** CRUD (Update)
- **Description :** Modifie les informations personnelles d'un utilisateur existant et non supprimé.
- **Endpoint API :** `PUT /api/user/{id}`
  - **Body :** `UserRequestDTO`
  - **Réponse :** HTTP 200 OK -> `ApiResponse<UserResponseDTO>`
- **Calculs/Transformations :** Copie manuelle via mapper (`copyUpdatableFields`) des champs mutables. Augmentation incrémentale du `@Version`.
- **Règles métier :**
  - L'utilisateur cible doit exister et `deleted == false`.
  - Vérification de l'unicité de l'email et du téléphone par rapport aux *autres* utilisateurs (`existsBy...AndDeletedFalseAndIdNot`).
- **DB/Relations :** Met à jour la table `users`. Modifie `updated_at` et `@Version` automatiquement.
- **Cas Spéciaux :** Possibilité de Conflit de Concurrence. Si deux mises à jour s'effectuent simultanément, génère `ObjectOptimisticLockingFailureException` (409 Conflict).

### 3.5. Delete User (Soft Delete)
- **Nom :** Suppression Utilisateur
- **Type :** CRUD (Delete / Opération Métier)
- **Description :** Archive (soft-delete) un utilisateur plutôt que de le supprimer physiquement de la base.
- **Endpoint API :** `DELETE /api/user/{id}`
  - **Réponse :** HTTP 200 OK -> `ApiResponse<Void>`
- **Règles métier :**
  - Règle de sécurité ultime : **Impossible de supprimer le dernier et unique ADMIN** du système.
  - Passe `deleted` à `true`.
- **Cas Spéciaux :** Utilisateur devient invisible pour la majorité des requêtes `findBy...AndDeletedFalse`.
- **Logs/Audit :** Création d'un `UserActivity` `DELETED` ("User soft deleted"). Log SLF4J enregistré.

### 3.6. Restore User
- **Nom :** Restauration Utilisateur
- **Type :** Opération Métier Spécifique
- **Description :** Réactive un utilisateur précédemment soft-deleted.
- **Endpoint API :** `PATCH /api/user/{id}/restore`
  - **Réponse :** HTTP 200 OK -> `ApiResponse<UserResponseDTO>`
- **Calculs/Transformations :** Renverse le flag `deleted` à `false`. 
- **Logs/Audit :** Création `UserActivity` -> `RESTORED`.

### 3.7. Gestion du Statut (Block, Suspend, Activate, Deactivate)
- **Noms :** Changement de statut utilisateur.
- **Endpoints :**
  - `PATCH /api/user/{id}/block`
  - `PATCH /api/user/{id}/suspend`
  - `PATCH /api/user/{id}/activate`
  - `PATCH /api/user/{id}/deactivate` (Statut INACTIVE)
- **Description :** Ces actions pilotent le cycle de vie de l'état du compte.
- **Réponse :** DTO mis à jour de l'utilisateur.
- **Règles métier :**
  - L'utilisateur ne doit pas être soft-deleted (`findForMutation`).
  - **Block :** Impossible de bloquer un utilisateur déjà bloqué. Impossible de bloquer le dernier `ADMIN`.
  - **Suspend :** Impossible de suspendre un utilisateur déjà suspendu.
  - **Activate :** Impossible d'activer directement un profil `BLOCKED` (il faut d'abord passer par INACTIVE = "deactivate"). Impossible d'activer un utilisateur `SUSPENDED` si son email n'est pas vérifié (`!emailVerified`).
- **Logs/Audit :** À chaque succès, une trace `STATUS_CHANGED` est actée dans `user_activities` (ex: "Status changed from PENDING_VERIFICATION to ACTIVE").

### 3.8. Change User Role
- **Nom :** Changement de rôle
- **Type :** Opération Métier Spécifique
- **Endpoint API :** `PATCH /api/user/{id}/role`
  - **Body :** `UserRoleChangeRequestDTO` (role)
- **Règles métier :** 
  - Si assignation du rôle `ADMIN`, le statut *doit* être exactement `ACTIVE`.
  - Règle de survie : Impossible de rétrograder le dernier `ADMIN`.
- **Logs/Audit :** `ROLE_CHANGED` inséré dans l'audit.

### 3.9. Statistiques ADMIN (Admin Stats)
- **Nom :** Tableau de bord de l'Admin
- **Type :** Opération Métier de lecture analytique
- **Endpoint API :** `GET /api/user/admin/stats`
  - **Header Requis :** `X-Actor-Id`
  - **Réponse :** HTTP 200 OK -> `ApiResponse<AdminStatsDTO>`
- **Calculs/Transformations :** 
  - Agrégations en base : `countByDeletedFalse`, `countByRoleAndDeletedFalse`, `countByStatusAndDeletedFalse`.
  - Agrégation temporelle : Inscriptions des dernières 24h via `countByCreatedAtAfterAndDeletedFalse`.
  - Calcul du Health Index (Score de santé du système) : `(activeUsers / totalUsers) * 100`.
- **Règles métier :** 
  - Exige une autorisation RBAC. La méthode `loadActor` vérifie que `X-Actor-Id` appartient à un utilisateur non supprimé avec le rôle `ADMIN`. Si échec : `ForbiddenException` (403).

### 3.10. Listes ADMIN & Activités
- **Endpoints :** 
  - `GET /api/user/admin/agents`
  - `GET /api/user/admin/clients`
  - `GET /api/user/admin/audit/{userId}` (Toutes les actions d'un uTilisateur)
  - `GET /api/user/admin/activities?role=...` (Audit global par rôle)
- **Règles métier :** Mêmes contraintes de vérification du rôle ADMIN sur le `X-Actor-Id`. Récupération des logs de `user_activities` triés par timestamp ascendant.

### 3.11. Agent Performance & Dashboard
- **Nom :** Suivi qualitatif de l'AGENT
- **Endpoint API :** `GET /api/user/agent/{agentId}/performance` et `/dashboard`
- **Calculs :**
  - Scanne toutes les entrées log `UserActivity` d'un agent.
  - Compte les `APPROVAL`, `REJECTION`, `CLIENT_HANDLED`.
  - Score = `(approvals * 100) / (approvals + rejections)`.
  - Calcul de Temps Moyen de Traitement : apparie chronologiquement les événements `PROCESSING_STARTED` et `PROCESSING_COMPLETED` pour un même agent et compile la moyenne en secondes.
- **Règles métier :** Réservé au rôle `AGENT`. Si l'agent est `SUSPENDED`, renvoie des statistiques vides par défaut.

### 3.12. Client Profil, Risque & Éligibilité
- **Endpoints :**
  - `GET /api/user/client/{clientId}/profile` (masque le n° de tél si SUSPENDED)
  - `GET /api/user/client/{clientId}/activities`
  - `GET /api/user/client/{clientId}/risk-score`
  - `GET /api/user/client/{clientId}/eligibility`
- **Calculs (ClientRiskScore) :**
  - Score de base de **50**.
  - Si le statut = `ACTIVE`, **+ 10**.
  - Parcours des `user_activity` (si contient le texte "to SUSPENDED" dans l'historique de statut), pénalité **- 20**.
  - Bonus **+ 2** points par activité enregistrée.
  - Bonus "ancienneté" : **+ 1** point tous les 30 jours (via parsing de `CreatedAt`).
  - Plafond à 30 si actuellement `SUSPENDED`. Score clamppé obligatoirement entre 0 et 100.
- **Calculs (ClientEligibility) :**
  - Refuse si le status n'est pas `ACTIVE` (renvoie raison).
  - Refuse si le RiskScore calculé précédemment est < **60**.
  - Si > 60 et actif, renvoie `{eligible: true, reason: "Eligible"}`.

---

## 4. DB et Relations entre Modèles

### 4.1. Table `user`
- Clé Primaire : `user_id`
- Mappage des énumérations (`status` et `role`) en string varchar.
- Optimistic Lock : Colonne `version`.
- Auditing auto: `created_at` (non updatable), `updated_at`, `created_by`, `updated_by`.
- Validation : `email` unique (`nullable=false`), `phone_number` unique. Flag `deleted` (`boolean`, défaut false).
- **Index:** `idx_user_email`, `idx_user_status`, `idx_user_role`, `idx_user_created_at`. Optimisation totale pour les KPIs de l'ADMIN et des listes dynamiques.

### 4.2. Table `user_activity`
- Agit comme **Event Sourcing** léger pour l'Audit.
- Colonne de rattachement (`FK` logique) : `user_id`. (Pas de FK relationnelle stricte via `@ManyToOne` dans le code Entity `UserActivity`, utilisation du type scalaire `Long userId` - architecture découplée évitant les surcharges de lazy-loading massif).
- Champs : `action_type` (Enum varchar), `description` (varchar 500), `timestamp` (Instant).
- **Index:** `idx_user_activity_user_id` et `idx_user_activity_timestamp`. Prêt pour les requêtes massives de performances agent/admin.

---

## 5. Résumé des Cas Particuliers

1. **Le Soft Delete Universel :** Toute interaction standard CRUD via Controller masque nativement les records supprimés à l'EXCEPTION d'un flag pour la restauration et les restrictions d'unicité d'email et téléphone (l'email d'un compte supprimé *peut* être réutilisé sur une nouvelle création).
2. **Protection Mutex (Optimistic Lock) :** Utilisation de l'annotation `@Version`. Aucun overwite accidentel de profil possible en environnement hyper-concurrentiel. L'erreur génère logiquement un HTTP 409 Conflict.
3. **Le Rôle Multi-Casquette Intégré (`X-Actor-Id`) :** L'architecture simule un context d'identité via paramètre/header pour contourner la session lourde (pratique en architecture API gateway micro-service friendly). Sécurisant les endpoints complexes (`adminStats`, `agentDashboard`).

## 6. Conclusion
Le module Backend User est un module "Core" extrêmement mature. Il fait preuve d'une robustesse "Banque-Grade" (Audit complet, verrouillage optimiste, contrôle granulaire des transitions d'états, aucune suppression physique), garantissant un suivi infalsifiable des indicateurs de performance des employés et de l’éligibilité des clients Kredia.
