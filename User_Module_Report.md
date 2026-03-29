# **User Module Report (Kredia)**

## **Sommaire**

1. **Introduction**
2. **Architecture globale**
3. **Fonctionnalités principales**
4. **Fonctionnalités multi-role**
5. **Endpoints REST**
6. **Tests et validation**
7. **Notes supplémentaires**
8. **Conclusion**

---

## **1) Introduction**

### **Objectif du module User**

Le module **User** centralise toute la gestion des utilisateurs du projet Kredia.

Il couvre :

- **Création et gestion** d’un utilisateur (CRUD)
- **Gestion d’état** (status) avec règles métiers strictes
- **Gestion de rôle** (RBAC) pour **ADMIN**, **AGENT**, **CLIENT**
- **Traçabilité** et **audit readiness** via **UserActivity** + auditing JPA
- **Robustesse** via optimistic locking, validation, gestion d’erreurs uniforme

### **Rôle dans le projet global**

Le module joue le rôle de **référentiel d’identité** et de **source d’autorité** pour les actions et tableaux de bord liés aux utilisateurs.

Il fournit aussi une base “banque-grade” pour :

- calculer des **KPIs** (ADMIN)
- suivre la **performance** (AGENT)
- simuler **risque** et **éligibilité** (CLIENT)

---

## **2) Architecture globale**

Le module suit une architecture en couches (controller/service/repository) avec DTOs, mapping, exceptions et configuration.

### **controller/**

- **UserController** (`src/main/java/com/kredia/controller/UserController.java`)
  - Expose les endpoints REST.
  - Reste volontairement “thin” : délègue toute logique métier au service.
  - Retourne les succès via `ApiResponse<T>`.

### **service/ + service/impl/**

- **UserService** (`src/main/java/com/kredia/service/UserService.java`)
  - Contrat du domaine User.
  - Définit le CRUD, la gestion status/roles, et les méthodes multi-role.

- **UserServiceImpl** (`src/main/java/com/kredia/service/impl/UserServiceImpl.java`)
  - Implémentation complète.
  - Applique les **business rules**, enregistre les **UserActivity** et effectue les calculs (KPIs, risques, performance).
  - Applique la **RBAC au niveau service** via des validations internes.

### **repository/**

- **UserRepository** (`src/main/java/com/kredia/repository/UserRepository.java`)
  - Accès aux `User`.
  - Fournit des méthodes de recherche/count pour filtres et KPIs (status/role, non supprimé, etc.).

- **UserActivityRepository** (`src/main/java/com/kredia/repository/UserActivityRepository.java`)
  - Accès aux `UserActivity`.
  - Permet de récupérer l’historique ordonné par timestamp pour un utilisateur (ou un set d’utilisateurs).

### **entity/**

- **User** (`src/main/java/com/kredia/entity/User.java`)
  - Entité JPA principale : identité, status, role, soft-delete, auditing.
  - Contient :
    - `@Version` (optimistic locking)
    - `deleted` (soft delete)
    - `createdAt/updatedAt` + `createdBy/updatedBy` (auditing)
    - index DB pour performance (email/status/role/created_at)

- **UserActivity** (`src/main/java/com/kredia/entity/UserActivity.java`)
  - Journal d’événements : `userId`, `actionType`, `description`, `timestamp`.
  - Index DB : `user_id`, `timestamp`.

- **UserActivityActionType** (`src/main/java/com/kredia/entity/UserActivityActionType.java`)
  - Enum des événements métiers :
    - `CREATED`, `STATUS_CHANGED`, `ROLE_CHANGED`, `DELETED`, `RESTORED`
    - Plus des types “multi-role” : `APPROVAL`, `REJECTION`, `CLIENT_HANDLED`, `PROCESSING_STARTED`, `PROCESSING_COMPLETED`

### **dto/**

- **ApiResponse** (`src/main/java/com/kredia/dto/ApiResponse.java`)
  - Wrapper standard des réponses de succès :
    - `success`, `data`, `timestamp`

- **UserRequestDTO** (`src/main/java/com/kredia/dto/UserRequestDTO.java`)
  - Payload d’entrée (Create/Update)
  - Validation via annotations (`@NotBlank`, `@Email`, `@Size`).

- **UserResponseDTO** (`src/main/java/com/kredia/dto/UserResponseDTO.java`)
  - Sortie : inclut données utilisateur + audit fields.

- **UserRoleChangeRequestDTO** (`src/main/java/com/kredia/dto/UserRoleChangeRequestDTO.java`)
  - Payload pour changer le rôle.

- **UserActivityResponseDTO** (`src/main/java/com/kredia/dto/UserActivityResponseDTO.java`)
  - Sortie représentant un événement `UserActivity`.

- **AdminStatsDTO** (`src/main/java/com/kredia/dto/AdminStatsDTO.java`)
  - KPIs admin : volumes (total, actifs, bloqués…), distribution des rôles, health index.

- **AgentPerformanceDTO** (`src/main/java/com/kredia/dto/AgentPerformanceDTO.java`)
  - Performance agent : approvals/rejections, score, traitement, temps moyen.

- **ClientRiskScoreDTO** (`src/main/java/com/kredia/dto/ClientRiskScoreDTO.java`)
  - Score de risque (0–100).

- **ClientEligibilityDTO** (`src/main/java/com/kredia/dto/ClientEligibilityDTO.java`)
  - Éligibilité booléenne + raison.

### **mapper/**

- **UserMapper** (`src/main/java/com/kredia/mapper/UserMapper.java`)
  - Mapping :
    - `UserRequestDTO` -> `User` (create)
    - copie des champs modifiables (update)
    - `User` -> `UserResponseDTO`

### **exception/**

- **BusinessException** (`src/main/java/com/kredia/exception/BusinessException.java`)
  - Erreurs de règles métiers -> HTTP 400.

- **ResourceNotFoundException** (`src/main/java/com/kredia/exception/ResourceNotFoundException.java`)
  - Entité introuvable -> HTTP 404.

- **ForbiddenException** (`src/main/java/com/kredia/exception/ForbiddenException.java`)
  - Violations RBAC / accès interdit -> HTTP 403.

- **ApiErrorResponse** (`src/main/java/com/kredia/exception/ApiErrorResponse.java`)
  - Format JSON d’erreur : `timestamp/status/error/message/path`.

- **GlobalExceptionHandler** (`src/main/java/com/kredia/exception/GlobalExceptionHandler.java`)
  - Mapping global :
    - 404 Not Found
    - 400 Business / Validation / DataIntegrity
    - 403 Forbidden
    - 409 Concurrency (optimistic lock)
    - 500 fallback

### **config/**

- **JpaAuditingConfig** (`src/main/java/com/kredia/config/JpaAuditingConfig.java`)
  - Active JPA auditing (`@EnableJpaAuditing`).
  - Fournit un `AuditorAware<String>` qui renvoie `SYSTEM` par défaut.

---

## **3) Fonctionnalités principales**

### **CRUD complet**

- **Create** :
  - `UserServiceImpl.create(...)` (`src/main/java/com/kredia/service/impl/UserServiceImpl.java`)
  - Règles : email/phone uniques (non supprimés).
  - Initialise :
    - `status = PENDING_VERIFICATION`
    - `role = CLIENT`
    - `deleted = false`
    - `emailVerified = false`
  - Enregistre une activité : `CREATED`.

- **Read** :
  - `getById(id)` lit uniquement les users `deleted=false`.

- **Update** :
  - `update(id, payload)` interdit si user soft-deleted.
  - Vérifie unicité email/phone (en excluant l’ID courant).

- **Delete (soft)** :
  - `delete(id)` met `deleted=true`.
  - Interdit de supprimer le **dernier ADMIN**.
  - Enregistre `DELETED`.

- **Restore** :
  - `restore(id)` remet `deleted=false`.
  - Enregistre `RESTORED`.

### **Gestion des rôles (RBAC)**

- Rôles : `ADMIN`, `AGENT`, `CLIENT` (`src/main/java/com/kredia/entity/UserRole.java`).
- La RBAC est appliquée au niveau **service**, via :
  - `validateRole(actor, expectedRole)` (`UserServiceImpl`)
  - `ForbiddenException` -> HTTP 403 (via `GlobalExceptionHandler`).

### **Status management**

- Status supportés (`src/main/java/com/kredia/entity/UserStatus.java`) :
  - `ACTIVE`, `INACTIVE`, `BLOCKED`, `SUSPENDED`, `PENDING_VERIFICATION`

### **Business rules clés**

- **Protection du dernier ADMIN**
  - Interdit :
    - delete du dernier admin
    - block du dernier admin
    - downgrade (changeRole) du dernier admin

- **Activation d’un BLOCKED**
  - `activate()` refuse un user `BLOCKED`.
  - Le flux attendu : `BLOCKED -> INACTIVE -> ACTIVE`.

- **Interdiction de muter un utilisateur supprimé (soft delete)**
  - Les mutations passent par `findForMutation()`.
  - Si `deleted=true` => `BusinessException("Deleted user cannot be modified; restore first")`.

### **Optimistic locking**

- `@Version` dans `User` (`src/main/java/com/kredia/entity/User.java`).
- En cas de mise à jour concurrente : `ObjectOptimisticLockingFailureException` -> HTTP 409.

### **Auditing**

- Champs dans `User` :
  - `createdAt`, `updatedAt`, `createdBy`, `updatedBy`
- Activé via `JpaAuditingConfig`.

### **Logging**

- `UserServiceImpl` utilise `SLF4J` (`LoggerFactory`) pour des logs structurés.

### **UserActivity tracking**

- Chaque action critique persiste une entrée `UserActivity`.

### **Validation DTO**

- `@Valid` dans `UserController`.
- `UserRequestDTO` utilise des contraintes de validation.

### **Pagination et filtres avancés**

- Endpoint `GET /api/users` supporte :
  - `email`, `status`, `role`, `createdFrom`, `createdTo` + `Pageable`.
- La recherche s’appuie sur `UserSpecifications` (`src/main/java/com/kredia/repository/UserSpecifications.java`).

---

## **4) Fonctionnalités multi-role**

### **Principe**

Le module propose des endpoints dédiés par rôle :

- **ADMIN** : KPIs, audit, list agents/clients, activités par rôle
- **AGENT** : dashboard/performance/activities
- **CLIENT** : profile/activities/risk-score/eligibility

### **Simulation RBAC via `X-Actor-Id`**

Pour les endpoints `ADMIN`, le contrôleur exige un header :

- `X-Actor-Id: <userId>`

Le service charge cet acteur via `loadActor(actorId)` puis applique :

- `validateRole(actor, ADMIN)`

Si le rôle ne correspond pas :

- `ForbiddenException("Access denied")` -> HTTP **403**

### **ADMIN : KPIs + audit**

- `adminStats(actorId)` :
  - total users, actifs/bloqués/suspendus
  - `last24hRegistrations`
  - distribution des rôles
  - `systemHealthIndex` = `% actifs`.

- `adminAudit(actorId, userId)` : retourne l’historique complet d’un utilisateur.

- `adminActivitiesByRole(actorId, role, pageable)` : agrège les activités des users d’un rôle.

### **AGENT : dashboard/performance**

- `agentPerformance(agentId)` :
  - compte `APPROVAL`, `REJECTION`, `CLIENT_HANDLED`
  - calcule `performanceScore = approvals / (approvals + rejections)`
  - calcule un temps moyen de traitement en associant `PROCESSING_STARTED` -> `PROCESSING_COMPLETED`.

### **CLIENT : risque + éligibilité**

- `clientRiskScore(clientId)` : score déterministe (0–100) basé sur :
  - status
  - événements (dont “a déjà été suspendu” détecté via description)
  - volume d’activités
  - ancienneté (createdAt)

- `clientEligibility(clientId)` :
  - refuse si `BLOCKED` / `SUSPENDED` / non `ACTIVE`
  - refuse si `riskScore < 60`
  - sinon éligible.

---

## **5) Endpoints REST**

Base URL : `http://localhost:8086`

### **CRUD + status + role (UserController)**

- **POST** `/api/users`
  - **Body**: `UserRequestDTO`
  - **Desc**: créer un user (CLIENT, PENDING_VERIFICATION)

- **GET** `/api/users`
  - **Params**: `email`, `status`, `role`, `createdFrom`, `createdTo`, pagination
  - **Desc**: recherche paginée avec filtres

- **GET** `/api/users/{id}`
  - **Desc**: récupérer un user (non supprimé)

- **PUT** `/api/users/{id}`
  - **Body**: `UserRequestDTO`
  - **Desc**: mise à jour (si non supprimé)

- **DELETE** `/api/users/{id}`
  - **Desc**: soft delete (protège dernier ADMIN)

- **PATCH** `/api/users/{id}/restore`
  - **Desc**: restore

- **PATCH** `/api/users/{id}/block`
  - **Desc**: block (protège dernier ADMIN)

- **PATCH** `/api/users/{id}/suspend`
  - **Desc**: suspend

- **PATCH** `/api/users/{id}/activate`
  - **Desc**: activate (BLOCKED interdit; SUSPENDED exige verification)

- **PATCH** `/api/users/{id}/deactivate`
  - **Desc**: INACTIVE

- **PATCH** `/api/users/{id}/role`
  - **Body**: `UserRoleChangeRequestDTO`
  - **Desc**: change role (ADMIN seulement si ACTIVE; dernier ADMIN protégé)

### **ADMIN endpoints**

- **GET** `/api/users/admin/stats`
  - **Header**: `X-Actor-Id`
  - **Desc**: KPIs admin (`AdminStatsDTO`)

- **GET** `/api/users/admin/agents`
  - **Header**: `X-Actor-Id`
  - **Desc**: liste paginée des agents

- **GET** `/api/users/admin/clients`
  - **Header**: `X-Actor-Id`
  - **Desc**: liste paginée des clients

- **GET** `/api/users/admin/audit/{userId}`
  - **Header**: `X-Actor-Id`
  - **Desc**: audit d’un user

- **GET** `/api/users/admin/activities?role=AGENT|CLIENT|ADMIN`
  - **Header**: `X-Actor-Id`
  - **Desc**: activités agrégées par rôle

### **AGENT endpoints**

- **GET** `/api/users/agent/{agentId}/dashboard`
  - **Desc**: dashboard agent (`AgentPerformanceDTO`)

- **GET** `/api/users/agent/{agentId}/performance`
  - **Desc**: performance agent (`AgentPerformanceDTO`)

- **GET** `/api/users/agent/{agentId}/activities`
  - **Desc**: activités agent

### **CLIENT endpoints**

- **GET** `/api/users/client/{clientId}/profile`
  - **Desc**: profil client (`UserResponseDTO`)

- **GET** `/api/users/client/{clientId}/activities`
  - **Desc**: activités client

- **GET** `/api/users/client/{clientId}/risk-score`
  - **Desc**: score de risque (`ClientRiskScoreDTO`)

- **GET** `/api/users/client/{clientId}/eligibility`
  - **Desc**: éligibilité (`ClientEligibilityDTO`)

### **Exemples `curl`**

Créer un user :

```bash
curl -X POST "http://localhost:8086/api/users" \
  -H "Content-Type: application/json" \
  -d '{"email":"client1@kredia.com","firstName":"Client","lastName":"One","phoneNumber":"0600000001"}'
```

Chercher avec pagination :

```bash
curl "http://localhost:8086/api/users?page=0&size=10&role=CLIENT"
```

Stats ADMIN (RBAC simulée via header) :

```bash
curl "http://localhost:8086/api/users/admin/stats" \
  -H "X-Actor-Id: 1"
```

Audit d’un user :

```bash
curl "http://localhost:8086/api/users/admin/audit/2" \
  -H "X-Actor-Id: 1"
```

Performance AGENT :

```bash
curl "http://localhost:8086/api/users/agent/10/performance"
```

Risk score CLIENT :

```bash
curl "http://localhost:8086/api/users/client/20/risk-score"
```

---

## **6) Tests et validation**

### **Unit tests**

- **UserServiceImplTest** (`src/test/java/com/kredia/service/impl/UserServiceImplTest.java`)
  - Vérifie :
    - delete dernier ADMIN interdit
    - block dernier ADMIN interdit
    - assignation ADMIN seulement si ACTIVE
    - mutation d’un user soft-deleted interdite
    - search utilise la spécification “not deleted”
    - duplicate email rejeté

### **Integration tests**

- **UserFlowIntegrationTest** (`src/test/java/com/kredia/integration/UserFlowIntegrationTest.java`)
  - Exécute un flow complet : création admin, activation, promotion ADMIN, création client, block, delete, restore.
  - Vérifie la persistance des activités (`UserActivity`).

### **Exception mapping**

- **GlobalExceptionHandlerTest** (`src/test/java/com/kredia/exception/GlobalExceptionHandlerTest.java`)
  - Vérifie le mapping 409 (optimistic locking).

- **UserControllerOptimisticLockTest** (`src/test/java/com/kredia/controller/UserControllerOptimisticLockTest.java`)
  - WebMvcTest : vérifie que `PUT /api/users/{id}` retourne 409 en cas de conflit.

### **Commandes Maven**

- `mvn test`
- `mvn clean install`

---

## **7) Notes supplémentaires**

### **Port fixe**

- Config : `server.port=8086` (`src/main/resources/application.properties`)

### **Build Maven stable**

- Projet Maven standard Spring Boot.

### **Warnings JVM (non liés au code)**

Il est possible d’observer des warnings du type `--enable-native-access` (Tomcat JNI) sur des JVM récentes.
Ces warnings ne sont pas liés à la logique du module User.

### **Structure homogène et production-ready**

- Séparation des responsabilités (controller/service/repository)
- Validation et erreurs uniformes
- Audit et versioning
- Soft-delete compatible “banque-grade”

---

## **8) Conclusion**

Le module **User** est structuré et prêt pour une intégration dans l’application :

- logique métier complète et cohérente
- RBAC appliquée au niveau service
- auditability via `UserActivity` + auditing JPA
- robustesse via optimistic locking
- endpoints REST clairs + réponses standardisées

**Prochaine étape recommandéeeeeeeee** : ajouter des tests dédiés aux endpoints multi-role (403 isolation + KPIs/performance/risque) pour finaliser la couverture.
