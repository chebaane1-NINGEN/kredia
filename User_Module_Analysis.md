# Rapport d'Analyse Complète : Module User (Backend Kredia)

## 1. Introduction
Ce rapport présente une analyse exhaustive du module **User** intégré au backend du projet **Kredia** (développé en Java/Spring Boot). Ce module central gère les identités (Client, Agent, Admin), les accès (RBAC), la sécurité, l'audit des actions, ainsi que des logiques métiers avancées telles que l'évaluation des risques (Risk Score), l'éligibilité, et les performances des agents (KPIs).

---

## 2. Architecture du Module
Le module User respecte l'architecture en N-tiers de Spring Boot. Voici l'explication de chaque package et des fichiers associés :

### 2.1 Les Entités (`com.kredia.entity.user.*`)
* **`User.java`** : Représente la table utilisateur (`user`). Contient toutes les infos de base (id, email, mot de passe hashé, nom, prénom, téléphone), ainsi que le statut, le rôle, un jeton de vérification (`verificationToken`), la suppression logique (`deleted`) et la relation d'assignation (`assignedAgent`).
* **`UserActivity.java`** : Représente l'historique d'audit (`user_activities`). Trace qui a fait quoi et quand (actionType, description).
* **`KycDocument.java`** : Table pour sauvegarder les documents officiels des utilisateurs dans le cadre de la vérification d'identité (Know Your Customer).

### 2.2 Les Énumérations (`com.kredia.enums.*` / `com.kredia.entity.user.*`)
* **`UserRole`** : `ADMIN`, `AGENT`, `CLIENT`.
* **`UserStatus`** : `PENDING_VERIFICATION`, `ACTIVE`, `INACTIVE`, `BLOCKED`, `SUSPENDED`.
* **`UserActivityActionType`** : `CREATED`, `STATUS_CHANGED`, `ROLE_CHANGED`, `DELETED`, `APPROVAL`, `PROCESSING_COMPLETED`, etc. 

### 2.3 Les DTOs (`com.kredia.dto.user.*`)
Objets utilisés pour transporter l'information entre l'API et la logique métier sans exposer directement la base de données.
* **`UserRequestDTO` & `UserResponseDTO`** : Pour la création et la lecture des infos.
* **`ClientProfileUpdateDTO` & `AdminUserUpdateDTO`** : Pour encadrer strictement ce qu'un client ou un admin peut modifier dans les profils.
* **DTOs Statistiques** : `AdminStatsDTO`, `AgentPerformanceDTO`, `ClientRiskScoreDTO`, `ClientEligibilityDTO`, `UserActivityResponseDTO`.

### 2.4 Les Repositories (`com.kredia.repository.user.*`)
* **`UserRepository`** : Interface Spring Data JPA permettant de communiquer avec la table `user`. Fournit des méthodes customisées comme `countByRoleAndDeletedFalse()`.
* **`UserActivityRepository`** : Récupère les logs d'activités (ex: trouver l'historique d'un agent).
* **`UserSpecifications`** : Gère la création de requêtes SQL dynamiques pour la recherche avancée (ex: filtres cumulés sur email, statut, date...).

### 2.5 Les Services (`com.kredia.service.user.*` & `impl.*`)
* **`UserServiceImpl`** : Contient **toute la logique métier**. C’est le cœur du module. Chaque méthode interroge, modifie et audite les utilisateurs en gardant le contrôle des règles (RBAC).
* **`AuthServiceImpl`** : Service séparé du `UserService` pour tout ce qui concerne la connexion, l'inscription pure, le JWT et la vérification de l'email.
* **`KycDocumentServiceImpl`** : Traite spécifiquement les uploads de fichiers KYC et la Validation / Rejet par les agents/admins.

### 2.6 Les Controllers (`com.kredia.controller.user.*`)
* **`UserController`** : Expose toutes les requêtes HTTP (Endpoints RESTful) vers l'extérieur. Gère le payload JSON et renvoie un format standard de réponse `ApiResponse`.
* **`AuthController`** : Expose les endpoints d'inscription et de login.

---

## 3. Fonctionnalités Principales
Le module englobe bien plus qu'une simple gestion de table :

1. **CRUD Complet (+ Soft Delete)** : Création sécurisée, lecture autorisée par profilage, modification stricte, et suppression logique (`deleted = true`) permettant de garder l'historique sans rupture d'intégrité. 
2. **Gestion fine des statuts** : Activation, Suspension, Blocage. Il y a des gardes-fous métiers (ex: on ne peut pas activer un profil SUSPENDED s'il n'a pas vérifié son email ; on ne peut pas débloquer directement un joueur BLOCKED).
3. **Changement de Rôles** : L'Administration peut promouvoir ou rétrograder un compte tout en préservant le système (interdiction de supprimer le dernier profil `ADMIN`).
4. **Assignation Client ↔ Agent** : Associe "physiquement" (clé étrangère `assignedAgent`) un Client à un employé (Agent). Cela donne un droit d'accès temporaire ou permanent à l'Agent sur le dossier du Client.
5. **Audit Trail (Historique des actions)** : La fonction `recordActivity` (dans `UserServiceImpl`) écrit de manière invisible une ligne dans la table `UserActivity` de manière exhaustive. (ex: Un admin a restauré un compte, un agent a évalué un dossier).
6. **Statistiques en Temps Réel** : Les tableaux de bord génèrent des "Snapshots" statistiques (Admin dashboard, Agent performance).

---

## 4. Accès & Droits (RBAC)
Le contrôle d'accès défini dans la méthode `validateAccess` et implosé dans chaque endpoint est intraitable :

* **Admin** :
  * Droit total sur le système pour voir les statistiques globales, tous les agents, tous les clients, et toute la piste d'audit.
  * Seul lui peut assigner/désassigner les Agents, supprimer, restaurer, bloquer, activer ou suspendre (un agent peut aussi suspendre *ses* clients).
  * Il est le seul à pouvoir promouvoir d'autres `ADMIN`.
* **Agent (Employé)** :
  * Ne peut voir et agir que sur son portefeuille (clients `assignedAgent == actor`).
  * Peut visualiser ses propres indicateurs KPIs et statistiques (performance).
  * Peut suspendre un client assigné en cas de dossier à risque, mais ne peut pas le détruire ni le bloquer définitivement.
* **Client** :
  * Accès restreint au "mode Mi-Miroir". Il ne peut voir que lui-même ou muter son propre profil.
  * Il a accès à ses activités historiques, à son Risk Score et à son Éligibilité qu'il peut consulter en lecture seule.

---

## 5. APIs (Endpoints REST)

Toutes les routes se trouvent sous le préfixe `/api/user` (excepté `/api/auth`). Le `X-Actor-Id` ou JWT est utilisé pour sécuriser l'appelant.

### 5.1 Endpoints Globaux & Authentification
* **POST** `/api/auth/register` : Crée un `CLIENT` status = `PENDING_VERIFICATION`.
* **POST** `/api/auth/login` : Connecte l'utilisateur et renvoie le jeton d'authentification (Token JWT).
* **POST** `/api/user` : Création de compte via le back-office.
* **GET** `/api/user` : Recherche paginée / filtrée multifactorielle `(email, status, role, dates)`.
* **GET** `/api/user/{id}` : Récupération des détails (restreint par RBAC).

### 5.2 Actions de Mutabilité (Statut et Rôle)
* **PUT** `/api/user/{id}/profile` (Pour Client), **PUT** `/api/user/{id}/admin` (Pour Admin).
* **DELETE** `/api/user/{id}` : Suppression logique.
* **PATCH** `/api/user/{id}/restore` / `block` / `activate` / `deactivate` / `suspend` / `role` : Endpoints dédiés à chaque transition pour maintenir une séparation des responsabilités saine dans les contrats.

### 5.3 Administration des Employés
* **POST** `/api/user/admin/assign?agentId=&clientId=` / **DELETE** : Gère l'affectation du portefeuille de clients.
* **GET** `/api/user/admin/stats` : Dashboard Admin (System Health, Répartition, Enregistrements 24h).
* **GET** `/api/user/admin/audit/{userId}` : Traçabilité totale des actions.

### 5.4 Plateforme Agent & Client
* **GET** `/api/user/agent/{id}/performance` : Retourne la vitesse et la pertinence du travailleur.
* **GET** `/api/user/client/{id}/risk-score` : Evalue le client de 0 à 100.
* **GET** `/api/user/client/{id}/eligibility` : Approuve de manière binaire un client.
* **POST** `/api/user/kyc/upload` : Uploader des pièces (ID, Factures).

---

## 6. Logiques Métiers Avancées (Business Logic)

L’intelligence logicielle de la fintech réside purement dans des méthodes du `UserServiceImpl`.

### 6.1 Le Score de Risque (Risk Score)
Méthode `clientRiskScore()`. Calcule et renvoie un nombre compris entre 0 (Risque Maximal) et 100 (Fiable à 100%).
**Formule intégrée :**
1. **Base (50 points)**
2. Bonus d'activité système : Si l'état compte est `ACTIVE` **(+10 pts)**.
3. Pénalité grave : Si le client a été `SUSPENDED` dans le passé selon la plateforme d'audit **(-20 pts)**.
4. Validation externe (KYC) : S'il y a des documents avec le statut `APPROVED` dans `kyc_document` **(+20 pts)**.
5. Bonus de stabilité : Les transactions/activités comptent (`actions.size() * 2`).
6. Bonus de longévité : Age du compte en mois.
*Exception : si le client est actuellement suspendu, le plafond est bridé à **30 points** maximum.*

### 6.2 Éligibilité (Eligibility)
Méthode booléenne `clientEligibility()`. C'est l'entonnoir d'octroi de crédits de Kredia.
**Vérifications :**
* `FALSE` : si BLOCKED.
* `FALSE` : si SUSPENDED.
* `FALSE` : si non `ACTIVE` (ie. en PENDING de vérification e-mail).
* `FALSE` : si le `Risk Score` est inférieur strict à **60 pts**.
* `TRUE` : Autrement.

### 6.3 Performance de l'Agent
Méthode `agentPerformance()`. Transforme un simple employé en un profil mesurable par sa productivité.
1. Filtre uniquement les `APPROVAL` (approbations de doc/crédit) et `REJECTION` dans `UserActivity`.
2. Score de performance = `(approbations / total d'actions) * 100`.
3. Temps moyen de traitement (`computeAverageProcessingTimeSeconds`) = Temps qui s'écoule entre `PROCESSING_STARTED` et `PROCESSING_COMPLETED` sur les actions de ses clients.
4. Comptes et Portefeuille = Nombre d'actions de type `CLIENT_HANDLED`.

---

## 7. KPIs (Indicateurs Clés de Performance)
Le reporting extrait de précieuses métriques (via `AdminStatsDTO` et `AgentPerformanceDTO`) calculées à la volée directement sur la base en lisant la base `UserRepository` en Count() et les aggrégations :

1. **System Health Index (Indice de santé global)** : `(Users Acts / Total Users) * 100`. Sert à identifier les bases de données remplies de "comptes fantômes" et inactifs VS les véritables utilisateurs engageants.
2. **Last 24h Registrations** : Le monitoring du pic d'utilisation des jours précédents. Utile en marketing et pour l'évaluation des attaques Botnet.
3. **Répartition Démographique (Role Distribution)** : Le Ratio Admin / Agent / Client permet à l'entreprise d'ajuster ses effectifs vis-à-vis du service client et de ses frais fixes en cas de sureffectif ou sous-effectif.
4. **Agent Processing Time (Temps de réponse moyen)** : La métrique phare pour le contrôle qualité. Une seconde ou un jour pour repérer quel agent est à la traîne.
5. **Score de Risque Client (Risk Score)** : Ce KPI est vendu ou internalisé dans les décisions de crédit ou d’assurance de ce service proptech/fintech.

---

## Conclusion
Le module `User` est le squelette de l'application sécurisée **Kredia**. En liant étroitement Spring Data JPA pour les recherches et les aggrégations en base, les sécurités d'injection contextuelle d'acteur (RBAC : Qui demande quoi), et les logiques métiers spécifiques de l'Audit Log, ce grand pan architectural garantit un espace certifié entre employés et clients.
