# Fiche Complete - Gestion Reclamation Kredia

Date: 30/03/2026

## Objectif

Ce document contient toutes les fonctionnalites de la gestion de reclamation de Kredia, avec:

- l'explication de chaque fonctionnalite
- l'endpoint associe
- le body a utiliser dans Postman
- les remarques utiles a dire au professeur

## Base URL

```text
http://localhost:8081/api/reclamations
```

## Valeurs autorisees

### Priority

```text
LOW
MEDIUM
HIGH
```

### ReclamationStatus

```text
OPEN
IN_PROGRESS
WAITING_CUSTOMER
ESCALATED
REOPENED
RESOLVED
REJECTED
```

### ReclamationCategory

```text
PAYMENT
CREDIT
KYC
FRAUD
ACCOUNT
TECHNICAL_SUPPORT
OTHER
```

### ReclamationMessageVisibility

```text
CUSTOMER
INTERNAL
```

## Fonctionnalites avec endpoints

## 1. Creation d'une reclamation

Explication:

- cree une nouvelle reclamation
- calcule automatiquement le risk score
- attribue un niveau de risque
- initialise le SLA
- ajoute une ligne dans l'historique
- peut auto-escalader si le risque est eleve

Endpoint:

```text
POST /api/reclamations
```

Body:

```json
{
  "userId": 1,
  "subject": "Probleme de paiement echeance",
  "description": "Mon paiement a ete debite mais mon echeance apparait toujours impayee dans l'application.",
  "priority": "HIGH",
  "category": "PAYMENT"
}
```

Ce que vous pouvez dire au prof:

- "La creation ne fait pas qu'un insert SQL. Elle declenche aussi la logique metier de scoring, SLA, historique et notifications."

## 2. Modification d'une reclamation

Explication:

- modifie le sujet
- modifie la description
- met a jour la priorite
- met a jour la categorie

Endpoint:

```text
PUT /api/reclamations/{id}
```

Exemple:

```text
PUT /api/reclamations/1
```

Body:

```json
{
  "subject": "Probleme de paiement toujours non resolu",
  "description": "Le montant a ete debite mais le probleme persiste toujours apres verification.",
  "priority": "HIGH",
  "category": "PAYMENT"
}
```

## 3. Changement de statut

Explication:

- fait avancer le workflow
- met a jour l'historique
- peut renseigner la premiere reponse
- peut renseigner la date de resolution

Endpoint:

```text
PATCH /api/reclamations/{id}/status
```

Body pour prise en charge:

```json
{
  "actorUserId": 2,
  "newStatus": "IN_PROGRESS",
  "note": "Le dossier est pris en charge par le support."
}
```

Body pour attente client:

```json
{
  "actorUserId": 2,
  "newStatus": "WAITING_CUSTOMER",
  "note": "Nous attendons un justificatif du client."
}
```

Body pour resolution:

```json
{
  "actorUserId": 2,
  "newStatus": "RESOLVED",
  "note": "Le probleme a ete resolu apres verification."
}
```

Body pour rejet:

```json
{
  "actorUserId": 2,
  "newStatus": "REJECTED",
  "note": "Le dossier a ete rejete apres analyse."
}
```

Body pour reouverture:

```json
{
  "actorUserId": 2,
  "newStatus": "REOPENED",
  "note": "Le dossier est reouvert suite a une nouvelle information."
}
```

## 4. Assignation a un agent

Explication:

- affecte une reclamation a un agent
- garde une trace dans l'historique

Endpoint:

```text
PATCH /api/reclamations/{id}/assign
```

Body:

```json
{
  "actorUserId": 2,
  "agentUserId": 5,
  "note": "Affectation a l'agent specialise paiement."
}
```

## 5. Consultation detaillee d'une reclamation

Explication:

- retourne toutes les informations du ticket
- permet de voir le statut, la priorite, la categorie, le risk score, le SLA et le feedback

Endpoint:

```text
GET /api/reclamations/{id}
```

Body:

```text
Pas de body
```

## 6. Liste paginee de toutes les reclamations

Endpoint:

```text
GET /api/reclamations?page=0&size=10
```

Body:

```text
Pas de body
```

## 7. Filtrage des reclamations par utilisateur

Endpoint:

```text
GET /api/reclamations/by-user/{userId}?page=0&size=10
```

Exemple:

```text
GET /api/reclamations/by-user/1?page=0&size=10
```

Body:

```text
Pas de body
```

## 8. Filtrage des reclamations par statut

Explication:

- permet par exemple de recuperer les reclamations `ESCALATED`

Endpoint:

```text
GET /api/reclamations/by-status?status=ESCALATED&page=0&size=10
```

Autres exemples:

```text
GET /api/reclamations/by-status?status=OPEN&page=0&size=10
GET /api/reclamations/by-status?status=WAITING_CUSTOMER&page=0&size=10
GET /api/reclamations/by-status?status=REOPENED&page=0&size=10
```

Body:

```text
Pas de body
```

## 9. Consultation du risk score

Explication:

- retourne le risk score stocke pour une reclamation

Endpoint:

```text
GET /api/reclamations/{id}/risk
```

Body:

```text
Pas de body
```

## 10. Consultation de l'historique

Explication:

- affiche toutes les actions faites sur la reclamation
- utile pour l'audit et pour montrer la traçabilite

Endpoint:

```text
GET /api/reclamations/{id}/history
```

Body:

```text
Pas de body
```

## 11. Ajout d'un message client

Explication:

- permet au client de repondre sur son dossier
- peut influencer le workflow

Endpoint:

```text
POST /api/reclamations/{id}/messages
```

Body:

```json
{
  "authorUserId": 1,
  "visibility": "CUSTOMER",
  "message": "Bonjour, je confirme que le montant a ete debite de mon compte."
}
```

## 12. Ajout d'une note interne

Explication:

- permet au support d'ecrire un commentaire interne non visible par le client

Endpoint:

```text
POST /api/reclamations/{id}/messages
```

Body:

```json
{
  "authorUserId": 2,
  "visibility": "INTERNAL",
  "message": "Verification en cours avec l'equipe financiere."
}
```

## 13. Consultation des messages

Explication:

- permet de voir les messages client
- avec `includeInternal=true`, on peut aussi voir les notes internes

Endpoints:

```text
GET /api/reclamations/{id}/messages?includeInternal=false
GET /api/reclamations/{id}/messages?includeInternal=true
```

Body:

```text
Pas de body
```

## 14. Ajout d'une piece jointe

Explication:

- permet d'ajouter une capture, un PDF ou un justificatif
- utilise `multipart/form-data`

Endpoint:

```text
POST /api/reclamations/{id}/attachments
```

Body Postman:

```text
Type: form-data

uploadedByUserId   10      Text
file               choisir un vrai fichier     File
```

Important:

- ne pas envoyer en JSON
- ne pas mettre `"file": "file"`
- choisir `Body > form-data`

## 15. Consultation des pieces jointes

Endpoint:

```text
GET /api/reclamations/{id}/attachments
```

Body:

```text
Pas de body
```

## 16. Detection de doublons

Explication:

- retourne les reclamations similaires du meme utilisateur

Endpoint:

```text
GET /api/reclamations/{id}/duplicates
```

Body:

```text
Pas de body
```

## 17. Feedback et satisfaction client

Explication:

- permet au client d'evaluer la qualite du traitement
- sauvegarde une note et un commentaire

Endpoint:

```text
POST /api/reclamations/{id}/feedback
```

Body:

```json
{
  "actorUserId": 1,
  "customerSatisfactionScore": 5,
  "customerFeedback": "Traitement rapide, clair et professionnel."
}
```

## 18. Dashboard KPI

Explication:

- donne une vision globale du module reclamation
- utile pour le pilotage et l'analyse

Endpoint:

```text
GET /api/reclamations/dashboard
```

Body:

```text
Pas de body
```

Le dashboard peut contenir:

- total des reclamations
- ouvertes
- en cours
- en attente client
- escaladees
- resolues
- rejetees
- retards SLA premiere reponse
- retards SLA resolution
- temps moyen de resolution
- satisfaction moyenne
- taux de resolution
- repartition par categorie

## Fonctionnalites automatiques sans endpoint direct

## 19. Categorisation automatique

Explication:

- si la categorie n'est pas fournie, le backend peut la detecter a partir du sujet et de la description

Ou l'expliquer:

- dans la logique metier du service

Ce qu'il faut dire:

- "La categorie peut etre deduite automatiquement a partir des mots-clés du message."

## 20. Calcul automatique du risk score ML

Explication:

- lors de la creation, le backend construit des features
- il appelle le service ML Python
- il recupere un `riskScore`

Ce qu'il faut dire:

- "Le score n'est pas saisi par l'utilisateur, il est calcule automatiquement a partir du contexte client."

## 21. Attribution automatique du niveau de risque

Explication:

- a partir du `riskScore`, le backend determine un `riskLevel`

Valeurs:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

## 22. Priorisation intelligente

Explication:

- la priorite peut etre ajustee automatiquement selon le risque et la categorie

Exemple:

- une reclamation `FRAUD` ou `HIGH RISK` peut devenir prioritaire

## 23. SLA dynamique

Explication:

- le backend calcule automatiquement:
  - `firstResponseDueAt`
  - `resolutionDueAt`
- ces delais changent selon la priorite, la categorie et le statut

Important:

- ce n'est pas un endpoint direct
- c'est une logique metier backend

Ce qu'il faut dire:

- "Le SLA est dynamique parce qu'il ne donne pas le meme delai a toutes les reclamations."

## 24. Escalade automatique par risque eleve

Explication:

- si le `riskLevel` est `HIGH` ou `CRITICAL`, la reclamation peut etre auto-escaladee

Statut obtenu:

```text
ESCALATED
```

## 25. Escalade automatique par depassement SLA

Explication:

- un scheduler Spring controle regulierement les reclamations actives
- si la date limite est depassee, le ticket est escalade

Ce qu'il faut dire:

- "L'escalade SLA est geree automatiquement par une tache planifiee et non par un utilisateur."

## 26. Mise a jour automatique de l'activite

Explication:

- le backend met a jour `lastActivityAt`
- cela permet de suivre la derniere action sur la reclamation

## 27. Reouverture automatique par message

Explication:

- si le client repond sur un dossier cloture, la reclamation peut etre reouverte

Statut:

```text
REOPENED
```

## 28. Notifications automatiques

Explication:

- creation
- changement de statut
- escalation
- nouveau message
- feedback

Tout cela peut declencher des notifications sans endpoint manuel.

## Ordre conseille pour la demonstration devant le professeur

## Etape 1 - Creation

```text
POST /api/reclamations
```

Body:

```json
{
  "userId": 1,
  "subject": "Probleme de paiement echeance",
  "description": "Mon paiement a ete debite mais mon echeance apparait toujours impayee dans l'application.",
  "priority": "HIGH",
  "category": "PAYMENT"
}
```

## Etape 2 - Consultation du detail

```text
GET /api/reclamations/1
```

## Etape 3 - Assignation agent

```text
PATCH /api/reclamations/1/assign
```

Body:

```json
{
  "actorUserId": 2,
  "agentUserId": 5,
  "note": "Affectation a l'agent specialise paiement."
}
```

## Etape 4 - Ajout d'une note interne

```text
POST /api/reclamations/1/messages
```

Body:

```json
{
  "authorUserId": 2,
  "visibility": "INTERNAL",
  "message": "Le dossier est en cours d'analyse interne."
}
```

## Etape 5 - Ajout d'une piece jointe

```text
POST /api/reclamations/1/attachments
```

Form-data:

```text
uploadedByUserId   10      Text
file               choisir un vrai fichier     File
```

## Etape 6 - Passage en attente client

```text
PATCH /api/reclamations/1/status
```

Body:

```json
{
  "actorUserId": 2,
  "newStatus": "WAITING_CUSTOMER",
  "note": "Merci de confirmer la date exacte du debit."
}
```

## Etape 7 - Reponse du client

```text
POST /api/reclamations/1/messages
```

Body:

```json
{
  "authorUserId": 1,
  "visibility": "CUSTOMER",
  "message": "Le debit a eu lieu hier a 14h20."
}
```

## Etape 8 - Resolution

```text
PATCH /api/reclamations/1/status
```

Body:

```json
{
  "actorUserId": 2,
  "newStatus": "RESOLVED",
  "note": "Le paiement a ete corrige dans le systeme."
}
```

## Etape 9 - Feedback

```text
POST /api/reclamations/1/feedback
```

Body:

```json
{
  "actorUserId": 1,
  "customerSatisfactionScore": 5,
  "customerFeedback": "Service rapide et professionnel."
}
```

## Etape 10 - KPI et verification finale

```text
GET /api/reclamations/dashboard
GET /api/reclamations/1/history
GET /api/reclamations/1/messages?includeInternal=true
GET /api/reclamations/1/attachments
GET /api/reclamations/by-status?status=ESCALATED&page=0&size=10
GET /api/reclamations/1/duplicates
```

## Conclusion courte a dire au professeur

"Mon module reclamation ne fait pas seulement du CRUD. Il integre un vrai workflow metier avec scoring de risque, SLA dynamique, escalade automatique, historique, messagerie, pieces jointes, feedback client et dashboard KPI. Les endpoints permettent de tester les actions utilisateur, tandis que certaines fonctionnalites avancees comme le SLA et l'escalade sont gerees automatiquement par le backend."
