# 🔍 Analyse Complète et Intégrale du Module "User" Kredia

Ce rapport présente une étude stricte et détaillée du module `User` actuel (Backend & Base de données). Il couvre l'exactitude des opérations CRUD, détaille les fonctionnalités par rôle, dresse un bilan exhaustif des manquements constatés et propose des axes d'amélioration précis.

---

## 🏗️ 1. Analyse Détaillée des Opérations CRUD par Endpoint

L'intégralité du module est exposée sous le chemin de base **`/api/user`**. Le module s'appuie fortement sur l'en-tête `X-Actor-Id` pour vérifier dynamiquement le contexte de l'appelant.

### 🟢 1.1. Create (Création)
- **Endpoint :** `POST /`
- **Paramètres (Body) :** `UserRequestDTO` (email, firstName, lastName, phoneNumber).
- **Réponse :** `UserResponseDTO` avec statut HTTP 201.
- **Vérifications :**
  - Validation du format des données (`@NotBlank`, `@Email`, `@Size`).
  - Unicité vérifiée en base pour l'email et le numéro de téléphone (en ignorant les users "soft deleted").
  - Le système force automatiquement le `status` à `PENDING_VERIFICATION`, le `role` à `CLIENT`, et `emailVerified` à `false`.
- **Règles par acteur :** Tout le système semble pouvoir l'appeler (aucun `X-Actor-Id` exigé au niveau contrôleur pour la création pure). Attention, cela se rapproche d'une simple route d'inscription.
- **Audit :** Génération d'un `UserActivity` (`CREATED`).

### 🔵 1.2. Read (Lecture)
Le read est divisé en plusieurs endpoints selon le contexte :

#### Recherche (Filter & Pagination)
- **Endpoint :** `GET /`
- **Paramètres :** Header `X-Actor-Id`. Query (`email`, `status`, `role`, `createdFrom`, `createdTo`, `page`, `size`).
- **Règles métier & Audit :**
  - **Admin** : Peut tout chercher.
  - **Agent** : Le résultat de la recherche est **restreint au niveau de la DB** (`UserSpecifications`) pour ne renvoyer que les clients assignés (`assignedAgentEquals`).
  - **Client** : S'il essaie de chercher, un filtre strict est imposé pour qu'il ne trouve que... lui-même. S'il cherche l'email de quelqu'un d'autre, une liste vide est renvoyée.

#### Get By ID
- **Endpoint :** `GET /{id}`
- **Règles métier :** La méthode `validateAccess(actor, target)` entre en jeu :
  - L'Agent ne peut voir que l'ID de son client attribué ou son propre ID.
  - Le Client ne peut requêter qu'avec son propre ID, sinon HTTP 403 Forbidden.

### 🟡 1.3. Update (Modification)
- **Endpoint :** `PUT /{id}`
- **Paramètres (Body) :** `UserRequestDTO` complets (Nom, Prénom, Email, Téléphone).
- **Règles métier :**
  - Contrôle `validateAccess(actor, target)` : un Client peut s'auto-modifier, un Agent peut modifier son propre compte ou son client.
  - Revérification de l'unicité des champs à l'update.
  - Utilisation du verouillage optimiste (via le champ `@Version` de l'entité) pour bloquer les "concurrent updates" invisibles.
- **Audit :** Génération d'un `UserActivity` (`STATUS_CHANGED` - attention à l'intitulé du log qui n'est pas "PROFILE_UPDATED" mais bien "Status changed", c'est une anomalie textuelle dans le code actuellement).

### 🔴 1.4. Delete (Suppression - Soft Delete)
- **Endpoint :** `DELETE /{id}`
- **Règles métier :** 
  - Exclusivement limité aux `ADMIN` (`validateRole(actor, UserRole.ADMIN)`).
  - Bascule du flag `deleted = true`. Aucune suppression physique n'est opérée (sécurisé historiquement).
  - Protection système : Interdiction de supprimer le dernier ADMIN de la plateforme.
- **Audit :** Action `DELETED` dans `user_activity`.

---

## 🎭 2. Analyse Fonctionnelle Détaillée par Rôle

### 👑 2.1. Rôle ADMIN
L'Admin dispose de privilèges systèmes "Full-Access" :
- **CRUD Total** : Lit, modifie, supprime et "restaure" tous les comptes (`PATCH /{id}/restore`).
- **Cycle de vie du statut** : Peut `block()`, `suspend()`, `activate()`, ou `deactivate()` n'importe qui.
- **Changement de Rôle** : `PATCH /{id}/role`. Peut promouvoir un utilisateur en ADMIN ou le rétrograder (avec protection du dernier ADMIN).
- **Assignation (`POST /admin/assign`)** : Possède le pouvoir unique d'assigner un `Client` à un `Agent`.
- **Analyse et Audit** :
  - **Stats Globaux (`/admin/stats`)** : Obtenir un Health Index, et la distribution totale des utilisateurs.
  - **Listings Purs** : `GET /admin/agent` et `GET /admin/client`.
  - **Traçabilité** : Possède un accès de lecture direct aux journaux via `/admin/audit/{userId}` ou toutes les actions d'un groupe via `/admin/activity?role=X`.

### 💼 2.2. Rôle AGENT / EMPLOYEE
L'Agent travaille uniquement dans "son périmètre" opérationnel :
- **Supervision des Clients** : L'Agent **ne voit que** les `Users` ayant pour `assigned_agent_id` sa propre ID.
- **Opérations sur ses Clients** : Il peut modifier son client (`PUT`), et a un **droit très spécial : il peut Suspendre son client** (`PATCH /{id}/suspend` vérifie `Objects.equals(user.getAssignedAgent(), actor)`). Seul l'Admin ou son propre Agent peut suspendre un utilisateur.
- **Son Espace "Dashboard"** :
  - Mettre à jour son propre profil.
  - Visualiser ses actions (`GET /agent/{agentId}/activity`).
  - **Tableau de performance KPI** (`GET /agent/{agentId}/performance`) : Calcule automatiquement son % d'approbations/rejets de demandes, et mesure surtout le **temps de traitement moyen**.

### 👤 2.3. Rôle CLIENT
Le Client est limité à l'Espace Personnel et Read-Only concernant le métier :
- **Profil** : Affiche/Modifie soi-même (`GET /client/{clientId}/profile`, `PUT /{id}`). Son téléphone lui est masqué si son compte passe en `SUSPENDED`.
- **Score de Risque (`/client/{clientId}/risk-score`)** : Calcule en temps réel son profil risque basé sur son ancienneté (+1/mois), son intégrité (+10 si ACTIVE), l'historique pénalisant (-20 s'il a déjà été suspendu), capé à 30 s'il est actuellement suspendu. Algorithme purement backend.
- **Éligibilité (`/client/{clientId}/eligibility`)** : Exige d'être statué "ACTIVE" ET d'avoir un score de risque ≥ 60 pour être finançable.
- Il peut voir son historique personnel (`activity`).

---

## 🚨 3. Vérification des Manquements Globaux (Code & DB)

L'audit détaillé de l'architecture backend soulève **plusieurs failles fonctionnelles fondamentales** et manques :

### ❌ Manquements Critiques (Absences)
1. **L'Absence Totale de "Mot de passe" et d'Authentification** : 
   L'entité `User` et le DTO `UserRequestDTO` ne possèdent ni champ `password`, ni configuration de hachage. Si le projet n'utilise pas un Keycloak externe pour l'Identity Access Management, le module n'est techniquement pas capable de "logguer" un utilisateur. Les routes register/login, forgot-password sont absentes.
2. **L'Absence du Parcours KYC (Know Your Customer)** : 
   Une entité `KycDocument` existe bien en base, reliée au `User`. Toutefois, **AUCUN ENDPOINT CRUD n'existe** dans le `UserController` ni dans le `UserService` pour qu'un Client upload ses documents, ou qu'un Agent/Admin les valide ! L'entité morte ne sert donc à rien pour l'instant et le processus KYC est purement théorique.
3. **Le Profil DTO unique partagé est permissif** : 
   On demande à un Client comme à un Admin d'utiliser `UserRequestDTO` pour faire un `PUT` sur le profil. Un client ne devrait pas pouvoir envoyer une requête contenant des métadonnées de statut s'il parvient à forger sa trame HTTP (le Mapper copie les champs).

### ⚠️ Manquements Fonctionnels ou Incomplets
1. **Dés-assignation d'Agent** : Un Admin peut assigner un client à un agent. Mais **il n'existe pas d'endpoint pour retirer un agent** ou transférer ce client dans un pool "non-assigné".
2. **Audit & Base de donnée (`@CreatedBy`)** : 
   Les champs d'auditing JPA (`createdBy`, `updatedBy`) configurés sur l'entité `User` resteront à `null` pour toujours si Spring Security/AuditorAware n'est pas configuré pour injecter le `X-Actor-Id` dans le SecurityContext global Spring.
3. **Absence d'historisation de l'assignation** : Rien dans le projet ne permet de savoir "Qui était l'agent de ce client le mois dernier ?". Le seul moyen est de fouiller les chaînes de texte dans le `UserActivity`.
4. **Pagination manquante sur les Activités** : L'endpoint client ou agent `.../activity` renvoie une `List<>` sans aucune pagination brute. Un ancien utilisateur fera crasher la mémoire de l'application s'il possède 10.000 logs d'activité.
5. **Absence d'Email de vérification** : Un statut existant en base (`emailVerified = false`) est présent. Mais un endpoint magique du genre `POST /verify-email?token=xxx` manque à l'appel.

---

## 💡 4. Propositions d'Amélioration et d'Enrichissement

Pour transformer ce module d'un bon CRUD applicatif vers une architecture "Fintech" totalement prête pour la production, voici le plan de remédiation :

### Priorité Haute (P0) - Sécurité & Flux Principal
- **Implémenter le parcours d'Authentification :**
  - **Correction :** Ajouter un champ `passwordHash` dans l'entité `User`.
  - **Nouveaux Endpoints /auth :** `POST /api/auth/register`, `POST /api/auth/login` (génération JWT classique contenant l'ID du User comme Actor), `POST /api/auth/forgot-password`.
- **Ressusciter l'Upload KYC :**
  - **Correction :** Créer un `KycDocumentService` et un contrôleur `/api/user/kyc`. 
  - **Endpoint Client :** `POST /api/user/kyc/upload` (multipart/form-data).
  - **Endpoint Agent :** `PATCH /api/user/kyc/{docId}/verify` (Accepter / Rejeter). Ce flux viendra directement nourrir le score de KPI de l'agent.

### Priorité Moyenne (P1) - Robustesse & Business Logic
- **Séparer les RequestDTO par rôle :**
  - Créer un `ClientProfileUpdateDTO` (qui n'autorise QUE le changement de firstName/lastName/phoneNumber/adresse).
  - Bloquer la mise à jour de l'Email côté client, et exiger une route `/api/user/change-email` avec vérification par OTP.
- **Implémenter la Dés-assignation / Ré-assignation :**
  - Créer l'endpoint Admin : `DELETE /admin/assign?clientId=123`.
- **Ajouter la Pagination sur l'Audit :**
  - Modifier le type de retour des listes d'activités : Mettre un argument `@PageableDefault Pageable` et retourner une `Page<UserActivityResponseDTO>`.

### Priorité Basse (P2) - Fintech-Grade Polish
- **Enrichissement de l'Entité `User` :** Dans la banque, on ne peut pas accorder de crédit sans une **Date de Naissance**, ou une **Adresse postale**. Il faut ajouter ces colonnes au module (DTO -> Mapper -> Entity).
- **Scheduled Job GDPR :** Ajouter un cronjob `@Scheduled` dans le Spring Boot qui vient purger les requêtes dans `UserActivity` de plus de X années, et qui efface "Physiquement" les utilisateurs dont la colonne `deleted` est à `true` depuis plus de 90 jours (Right to be forgotten/Droit à l'oubli).
