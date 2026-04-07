# Preparation orale - Validation Spring Boot - Module Reclamation Kredia

Date: 28/03/2026

## Objectif

Ce document sert a preparer une validation orale avec le professeur sur le module de gestion de reclamation de Kredia.

Il est construit a partir:

- de vos supports de cours Spring Boot / Maven
- du cours WS REST avec Spring
- du cours Spring Data JPA Entites
- du cours Spring Data JPA Associations
- du cours Spring Data JPA JpaRepository
- du cours Lombok
- du support Spring Doc / OpenAPI

Le but est de vous donner:

- les questions probables du professeur
- des reponses courtes et claires
- le lien direct avec votre code reclamation
- les points forts a mettre en avant
- les limites a reconnaitre de facon professionnelle

## Mini pitch oral de 40 secondes

Si le professeur vous dit: "Explique-moi ton module reclamation", vous pouvez repondre:

"Mon module reclamation est un backend Spring Boot organise en couches Controller, Service, Repository et Entity. Il permet de creer, modifier, assigner et suivre une reclamation avec un workflow avance. J'ai ajoute un score de risque ML, une categorisation automatique, des SLA avec escalation automatique, une messagerie client et interne, des pieces jointes, la detection de doublons, un dashboard KPI et le feedback client. Techniquement, j'utilise Spring Web pour les API REST, Spring Data JPA pour la persistence, Lombok pour reduire le boilerplate, Flyway pour les migrations et un scheduler Spring pour les controles SLA."

## Vue rapide du module reclamation

Les classes importantes a connaitre:

- `ReclamationController`
- `ReclamationServiceImpl`
- `ReclamationRepository`
- `Reclamation`
- `ReclamationHistory`
- `ReclamationMessage`
- `ReclamationAttachment`
- `ReclamationSlaScheduler`
- `ReclamationTriggerServiceImpl`
- `GlobalExceptionHandler`

## 1. Questions probables - Spring Boot et Maven

### Question 1 - C'est quoi Spring Boot ?

Reponse:

Spring Boot est une extension de Spring qui simplifie le demarrage d'un projet grace a l'auto-configuration, aux starters et a une structure de projet prete a l'emploi.

Dans votre projet:

- `@SpringBootApplication` dans `KrediaApplication`
- demarrage simple via `SpringApplication.run(...)`
- configuration centralisee dans `application.properties`

### Question 2 - Pourquoi utiliser Maven dans votre projet ?

Reponse:

Maven sert a gerer les dependances, la compilation, le packaging et le cycle de vie du projet. Le fichier `pom.xml` centralise tout.

Dans votre projet:

- `spring-boot-starter-web`
- `spring-boot-starter-data-jpa`
- `spring-boot-starter-validation`
- `mysql-connector-j`
- `flyway`
- `lombok`
- `openpdf`
- `cloudinary`

### Question 3 - Quel est le role du `pom.xml` ?

Reponse:

Le `pom.xml` definit l'identite du projet, la version de Java, les dependances et les plugins Maven. C'est lui qui permet de construire l'application.

### Question 4 - Pourquoi avez-vous active `@EnableScheduling` ?

Reponse:

Je l'ai active pour executer automatiquement les taches planifiees, surtout le controle des SLA dans le module reclamation.

Dans votre code:

- `KrediaApplication` contient `@EnableScheduling`
- `ReclamationSlaScheduler` contient `@Scheduled`

### Question 5 - Pourquoi avez-vous `@EnableAsync` ?

Reponse:

Cela prepare l'application a executer certaines taches de facon asynchrone si besoin. Meme si le module reclamation ne l'exploite pas encore fortement, c'est une base d'evolution.

## 2. Questions probables - WS REST avec Spring

### Question 6 - Pourquoi `@RestController` et pas `@Controller` ?

Reponse:

`@RestController` combine `@Controller` et `@ResponseBody`, donc les methodes renvoient directement du JSON pour les API REST.

Dans votre code:

- `ReclamationController` expose l'API `/api/reclamations`

### Question 7 - Pourquoi utiliser `@RequestMapping`, `@GetMapping`, `@PostMapping`, `@PatchMapping`, `@PutMapping` ?

Reponse:

Ces annotations permettent de mapper les URLs et les verbes HTTP vers les bonnes methodes Java.

Exemples dans votre module:

- `POST /api/reclamations` pour creer
- `PUT /api/reclamations/{id}` pour modifier
- `PATCH /api/reclamations/{id}/status` pour changer le statut
- `GET /api/reclamations/{id}` pour consulter

### Question 8 - Pourquoi avez-vous choisi `PATCH` pour le statut et l'assignation ?

Reponse:

Parce que je ne modifie qu'une partie de la ressource et non toute la reclamation. `PATCH` est plus adapte qu'un `PUT` complet.

### Question 9 - Pourquoi utiliser des DTO et pas exposer directement les entites JPA ?

Reponse:

Les DTO permettent de controler les donnees d'entree et de sortie, d'eviter d'exposer la structure interne des entites, et de separer l'API de la persistence.

Dans votre code:

- `ReclamationCreateRequest`
- `ReclamationUpdateRequest`
- `ReclamationStatusUpdateRequest`
- `ReclamationAssignRequest`
- `ReclamationResponse`

### Question 10 - A quoi sert `@Valid` ?

Reponse:

`@Valid` declenche la validation des DTO en utilisant les contraintes declarees avec `@NotNull`, `@NotBlank`, `@Size`, etc.

Exemples:

- `userId` obligatoire a la creation
- `subject` obligatoire
- `description` entre 10 et 5000 caracteres

### Question 11 - Pourquoi avoir un `GlobalExceptionHandler` ?

Reponse:

Pour centraliser la gestion des erreurs et renvoyer des reponses JSON propres et coherentes, plutot que des stack traces brutes.

Dans votre code:

- `404` pour `NotFoundException`
- `400` pour `BadRequestException`
- `400` pour erreurs de validation
- `500` pour erreurs non prevues

### Question 12 - Pourquoi l'endpoint attachment utilise `MultipartFile` et non un JSON ?

Reponse:

Parce qu'un fichier binaire se transmet en `multipart/form-data`, pas en JSON. JSON sert aux donnees textuelles structurees, pas au contenu d'un vrai fichier.

## 3. Questions probables - Spring Data JPA Entites

### Question 13 - Qu'est-ce qu'une entite JPA ?

Reponse:

Une entite JPA est une classe Java mappee sur une table de base de donnees avec `@Entity`.

Dans votre code:

- `Reclamation` mappe la table `reclamation`
- `ReclamationHistory` mappe `reclamation_history`
- `ReclamationMessage` mappe `reclamation_message`
- `ReclamationAttachment` mappe `reclamation_attachment`

### Question 14 - Pourquoi `@Id` et `@GeneratedValue(strategy = GenerationType.IDENTITY)` ?

Reponse:

`@Id` indique la cle primaire. `IDENTITY` laisse la base generer automatiquement l'identifiant auto-increment.

### Question 15 - Pourquoi utilisez-vous `@Enumerated(EnumType.STRING)` ?

Reponse:

Je stocke les enums en texte pour rendre la base plus lisible et eviter les problemes si l'ordre des valeurs enum change.

Exemple:

- `status`
- `priority`
- `category`
- `riskLevel`

### Question 16 - Pourquoi `@Lob` sur certaines colonnes ?

Reponse:

`@Lob` permet de stocker du texte potentiellement long. Je l'utilise pour la description de reclamation et les messages.

### Question 17 - A quoi servent `@PrePersist` et `@PreUpdate` ?

Reponse:

Ce sont des callbacks JPA. Ils servent ici a initialiser ou mettre a jour automatiquement certaines dates et valeurs par defaut.

Exemple dans `Reclamation`:

- `createdAt`
- `lastActivityAt`
- statut par defaut `OPEN`
- priorite par defaut `MEDIUM`

### Question 18 - Pourquoi avoir defini des indexes dans `@Table(indexes = ...)` ?

Reponse:

Pour accelerer les recherches frequentes sur les colonnes souvent filtrees ou triees, comme le statut, la date, la categorie ou les deadlines SLA.

## 4. Questions probables - JPA Associations

### Question 19 - Quelle association avez-vous entre `ReclamationMessage` et `Reclamation` ?

Reponse:

J'ai une relation `ManyToOne` du message vers la reclamation, car plusieurs messages peuvent appartenir a une seule reclamation.

### Question 20 - Meme question pour `ReclamationHistory` et `Reclamation` ?

Reponse:

C'est aussi un `ManyToOne`, parce qu'une reclamation peut avoir plusieurs lignes d'historique.

### Question 21 - Pourquoi `fetch = FetchType.LAZY` ?

Reponse:

Pour ne pas charger automatiquement toutes les reclamations et leurs dependances si je n'en ai pas besoin, ce qui ameliore les performances.

### Question 22 - Pourquoi `userId` et `assignedTo` sont des `Long` et pas des associations JPA vers `User` ?

Reponse:

J'ai choisi une approche plus legere pour limiter le couplage, eviter certains chargements inutiles et garder la gestion utilisateur decouplee du module reclamation. En revanche, pour les objets purement internes au module, j'ai utilise de vraies associations JPA vers `Reclamation`.

### Question 23 - Pourquoi ne pas tout mettre en bidirectionnel ?

Reponse:

Les relations bidirectionnelles augmentent la complexite, les risques de boucle de serialisation JSON et le couplage. J'ai garde seulement ce qui etait utile fonctionnellement.

## 5. Questions probables - JpaRepository

### Question 24 - Pourquoi `ReclamationRepository extends JpaRepository<Reclamation, Long>` ?

Reponse:

Parce que `JpaRepository` fournit deja les operations CRUD, la pagination, le tri et les methodes de base sans ecrire d'implementation manuelle.

### Question 25 - Donnez un exemple de query method dans votre projet

Reponse:

Exemples:

- `findByUserId(...)`
- `findByStatus(...)`
- `countByUserId(...)`
- `findByFirstResponseDueAtBeforeAndFirstResponseAtIsNullAndStatusIn(...)`

### Question 26 - Pourquoi utilisez-vous `@Query` dans certains cas ?

Reponse:

Quand la logique devient plus specifique que ce que les query methods standards expriment facilement. Par exemple, pour la detection de doublons par comparaison sur `subject` et `description`.

### Question 27 - Pourquoi utiliser `Page` et `Pageable` ?

Reponse:

Pour paginer les resultats et eviter de charger trop de donnees d'un coup. C'est une bonne pratique API et performance.

### Question 28 - Pourquoi certaines requetes sont en SQL natif ?

Reponse:

Pour ecrire une logique precise de comparaison et de performance, par exemple la recherche de doublons. C'est un choix ponctuel quand JPQL ou les query methods sont moins pratiques.

## 6. Questions probables - Lombok

### Question 29 - Pourquoi utilisez-vous Lombok ?

Reponse:

Pour reduire le boilerplate et rendre le code plus lisible.

Dans votre projet, on trouve notamment:

- `@Getter`
- `@Setter`
- `@NoArgsConstructor`
- `@AllArgsConstructor`
- `@Builder`
- `@RequiredArgsConstructor`
- `@Slf4j`

### Question 30 - Donnez un exemple concret d'utilite de Lombok dans votre code

Reponse:

Dans les entites comme `Reclamation`, Lombok genere automatiquement getters, setters et constructeurs. Dans les services, `@RequiredArgsConstructor` injecte les dependances `final` sans ecrire le constructeur a la main.

### Question 31 - Y a-t-il une limite a Lombok ?

Reponse:

Oui. Lombok simplifie beaucoup le code, mais il peut rendre certains comportements moins visibles a un debutant. Il faut donc bien comprendre ce qu'il genere.

## 7. Questions probables - Spring Doc / Swagger

### Question 32 - Avez-vous integre SpringDoc / Swagger dans votre projet ?

Reponse honnete et professionnelle:

Pas encore dans l'etat actuel du projet. J'ai surtout prepare et teste mes endpoints via Postman et via une documentation PDF. En revanche, je connais le principe: SpringDoc permet de generer automatiquement une documentation OpenAPI et une interface Swagger UI pour tester les endpoints.

### Question 33 - Si le professeur vous demande comment l'ajouter ?

Reponse:

- ajouter la dependance SpringDoc adapte a Spring Boot 3
- lancer l'application
- acceder a `/swagger-ui.html` ou `/swagger-ui/index.html`
- acceder au JSON OpenAPI via `/v3/api-docs`

### Question 34 - Pourquoi ce serait utile dans votre module reclamation ?

Reponse:

Parce que j'ai beaucoup d'endpoints REST et plusieurs DTO. SpringDoc faciliterait la visualisation, le test et la documentation automatique des APIs.

## 8. Questions probables - Logique metier du module reclamation

### Question 35 - Que se passe-t-il exactement lors de la creation d'une reclamation ?

Reponse:

1. creation de l'objet reclamation
2. extraction des features ML
3. sauvegarde initiale
4. ajout a l'historique
5. notification de creation
6. prediction du score de risque
7. calcul du `riskLevel`
8. ajustement de la priorite
9. initialisation du SLA
10. auto-escalade eventuelle
11. sauvegarde finale

### Question 36 - A quoi sert le `riskScore` ?

Reponse:

Le `riskScore` permet d'estimer la criticite du dossier. Il influence le `riskLevel`, la priorite et potentiellement l'escalade automatique.

### Question 37 - Quelles sont les features envoyees au service ML ?

Reponse:

Dans votre projet, on envoie notamment:

- `subject`
- `description`
- `status`
- `priority`
- `duplicate_count`
- `past_reclamations`
- `transaction_amount`
- `late_credit`

### Question 38 - C'est quoi un SLA dans votre projet ?

Reponse:

C'est un engagement de delai. J'ai deux dates importantes:

- `firstResponseDueAt`
- `resolutionDueAt`

Elles dependent de la priorite, de la categorie et du statut.

### Question 39 - Comment fonctionne l'auto-escalade SLA ?

Reponse:

Un scheduler Spring verifie regulierement les reclamations actives. Si la deadline de premiere reponse ou de resolution est depassee, la reclamation passe en `ESCALATED` avec une priorite haute.

### Question 40 - Pourquoi avoir plusieurs statuts et pas seulement OPEN/RESOLVED ?

Reponse:

Parce qu'un workflow reel est plus riche. J'ai besoin de distinguer:

- prise en charge
- attente client
- escalation
- reouverture
- resolution
- rejet

### Question 41 - Comment gerez-vous la reouverture ?

Reponse:

Une reclamation `RESOLVED` ou `REJECTED` peut passer en `REOPENED`. On reinitialise alors certains elements du SLA et du cycle de traitement.

### Question 42 - Comment gerez-vous les messages et les notes internes ?

Reponse:

J'ai une entite `ReclamationMessage` avec une `visibility`:

- `CUSTOMER`
- `INTERNAL`

Cela permet de separer les messages visibles client des notes techniques internes.

### Question 43 - Pourquoi les pieces jointes sont utiles dans votre module ?

Reponse:

Elles permettent d'ajouter des preuves ou des justificatifs, par exemple une capture d'ecran, un PDF ou un recu de paiement.

### Question 44 - Comment detectez-vous les doublons ?

Reponse:

Je compare des reclamations du meme utilisateur en utilisant le `subject` et la `description`, via une requete repository dediee.

### Question 45 - A quoi sert le dashboard ?

Reponse:

Le dashboard sert au pilotage:

- nombre total de reclamations
- ouvertes
- en cours
- escaladees
- resolues
- rejetees
- retards SLA
- satisfaction moyenne
- taux de resolution
- repartition par categorie

## 9. Questions probables - Architecture logicielle

### Question 46 - Pourquoi separer Controller, Service, Repository ?

Reponse:

Pour respecter une architecture en couches:

- Controller: expose les endpoints REST
- Service: contient la logique metier
- Repository: gere l'acces aux donnees

Cela rend le projet plus clair, testable et maintenable.

### Question 47 - Pourquoi annoter le service avec `@Transactional` ?

Reponse:

Parce que plusieurs operations doivent reussir ensemble: sauvegarde reclamation, historique, notifications, messages, attachments, etc. La transaction assure la coherence.

### Question 48 - Pourquoi mettre `@Transactional(readOnly = true)` sur les lectures ?

Reponse:

C'est une bonne pratique pour signaler qu'on ne modifie pas les donnees et pour optimiser le contexte transactionnel.

## 10. Questions pieges possibles

### Question 49 - Pourquoi vos endpoints GET n'ont pas de body ?

Reponse:

Parce qu'en REST, les GET recuperent des ressources et utilisent surtout l'URL et les query params. Un body n'est pas la pratique standard pour un GET.

### Question 50 - Pourquoi `PATCH` et pas `POST` pour le changement de statut ?

Reponse:

Parce que je modifie partiellement une ressource existante. `POST` sert plutot a creer une ressource ou declencher une action non idempotente.

### Question 51 - Quelle difference entre `BadRequestException` et `NotFoundException` ?

Reponse:

- `BadRequestException`: la demande est invalide fonctionnellement
- `NotFoundException`: la ressource demandee n'existe pas

### Question 52 - Pourquoi votre module est plus qu'un simple CRUD ?

Reponse:

Parce qu'il contient une vraie logique metier:

- workflow avance
- SLA
- scheduler
- historique
- notifications
- pieces jointes
- messages
- feedback
- dashboard
- ML risk scoring

## 11. Limites que vous pouvez reconnaitre intelligemment

Si le professeur critique un point, vous pouvez repondre de facon mature:

- SpringDoc n'est pas encore branche, mais l'API est deja prete a etre documentee
- certaines heuristiques de categorisation sont simples et peuvent etre ameliorees
- le moteur ML est externe, donc sa qualite depend du modele entraine
- la securite complete et les roles peuvent encore etre renforces
- certaines relations avec `User` sont volontairement simplifiees par des IDs pour limiter le couplage

## 12. Questions a fort potentiel pendant la validation

Si vous manquez de temps, retenez au minimum ces 10 questions:

- C'est quoi Spring Boot ?
- Pourquoi Maven ?
- Pourquoi `@RestController` ?
- Pourquoi des DTO ?
- Pourquoi `@Valid` ?
- Pourquoi `JpaRepository` ?
- Pourquoi `@Entity` ?
- Pourquoi `@Enumerated(EnumType.STRING)` ?
- Comment fonctionne votre SLA ?
- Qu'est-ce qui rend votre module reclamation avance ?

## 13. Conclusion orale courte

Pour terminer proprement si le professeur vous demande une synthese:

"Mon module reclamation applique concretement les notions vues en cours: architecture Spring Boot, APIs REST, validation, JPA, repositories, entites, associations, Lombok et gestion des erreurs. J'ai essaye d'aller plus loin qu'un simple CRUD en ajoutant du workflow metier, du SLA, du ML, de l'historique, des messages, des pieces jointes et des KPI. Donc le projet montre a la fois la maitrise technique du cours et une vraie logique metier."
