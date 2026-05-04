# Guide Postman - Gestion Reclamation Avancee Kredia

Date: 27/03/2026

## Objectif

Ce document regroupe toutes les fonctionnalites avancees du module de gestion de reclamation de Kredia, avec:

- l'explication de chaque fonctionnalite
- son endpoint
- le body exact a utiliser dans Postman
- l'ordre recommande pour une demonstration devant le professeur

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

## IDs de test recommandes

Pour une demo simple, utilisez des IDs qui existent deja dans votre base:

- `userId = 1` pour le client
- `actorUserId = 2` pour le support ou admin
- `agentUserId = 5` pour l'agent
- `reclamationId = 1` ou l'ID retourne apres creation

## Fonctionnalites avancees

## 1. Creation intelligente d'une reclamation

Explication:

- cree la reclamation
- detecte la categorie si besoin
- calcule le score de risque ML
- fixe le niveau de risque
- ajuste la priorite
- initialise le SLA
- enregistre l'historique
- envoie une notification
- peut auto-escalader si le risque est eleve

Endpoint:

```text
POST /api/reclamations
```

Body Postman:

```json
{
  "userId": 1,
  "subject": "Probleme de paiement echeance",
  "description": "Mon paiement a ete debite mais mon echeance apparait toujours impayee dans l'application.",
  "priority": "HIGH",
  "category": "PAYMENT"
}
```

## 2. Modification d'une reclamation

Explication:

- met a jour le sujet
- met a jour la description
- permet de changer la priorite
- permet de changer la categorie
- recalcule le contexte fonctionnel de la reclamation

Endpoint:

```text
PUT /api/reclamations/{id}
```

Exemple:

```text
PUT /api/reclamations/1
```

Body Postman:

```json
{
  "subject": "Probleme de paiement toujours non resolu",
  "description": "Le montant a ete debite, mais la situation est toujours bloquee apres verification.",
  "priority": "HIGH",
  "category": "PAYMENT"
}
```

## 3. Changement de statut avance

Explication:

- fait evoluer le workflow du ticket
- met a jour l'historique
- peut remplir la date de premiere reponse
- peut renseigner la date de resolution
- envoie des notifications automatiques

Endpoint:

```text
PATCH /api/reclamations/{id}/status
```

Body Postman pour prise en charge:

```json
{
  "actorUserId": 2,
  "newStatus": "IN_PROGRESS",
  "note": "Le dossier est pris en charge par le support."
}
```

Body Postman pour attente client:

```json
{
  "actorUserId": 2,
  "newStatus": "WAITING_CUSTOMER",
  "note": "Nous attendons un justificatif ou une capture d'ecran du client."
}
```

Body Postman pour resolution:

```json
{
  "actorUserId": 2,
  "newStatus": "RESOLVED",
  "note": "Le paiement a ete rapproche et le dossier est resolu."
}
```

Body Postman pour rejet:

```json
{
  "actorUserId": 2,
  "newStatus": "REJECTED",
  "note": "Reclamation rejetee apres verification du dossier."
}
```

Body Postman pour reouverture:

```json
{
  "actorUserId": 2,
  "newStatus": "REOPENED",
  "note": "Le ticket est reouvert suite a une nouvelle information."
}
```

## 4. Affectation a un agent

Explication:

- attribue la reclamation a un agent
- trace l'action dans l'historique
- notifie le personnel concerne

Endpoint:

```text
PATCH /api/reclamations/{id}/assign
```

Body Postman:

```json
{
  "actorUserId": 2,
  "agentUserId": 5,
  "note": "Affectation a l'agent specialise paiement."
}
```

## 5. Consultation detaillee d'une reclamation

Explication:

- retourne le detail complet
- inclut le statut, la priorite, la categorie, le risque et le SLA

Endpoint:

```text
GET /api/reclamations/{id}
```

Body Postman:

```text
Pas de body
```

## 6. Liste paginee des reclamations

Explication:

- liste toutes les reclamations avec pagination

Endpoint:

```text
GET /api/reclamations?page=0&size=10
```

Body Postman:

```text
Pas de body
```

## 7. Filtrage par utilisateur

Explication:

- retourne toutes les reclamations d'un client

Endpoint:

```text
GET /api/reclamations/by-user/{userId}?page=0&size=10
```

Exemple:

```text
GET /api/reclamations/by-user/1?page=0&size=10
```

Body Postman:

```text
Pas de body
```

## 8. Filtrage par statut

Explication:

- permet d'afficher les reclamations par etat

Endpoint:

```text
GET /api/reclamations/by-status?status=OPEN&page=0&size=10
```

Body Postman:

```text
Pas de body
```

## 9. Consultation du score de risque

Explication:

- retourne le score de risque de la reclamation

Endpoint:

```text
GET /api/reclamations/{id}/risk
```

Body Postman:

```text
Pas de body
```

## 10. Historique complet de la reclamation

Explication:

- affiche toutes les actions faites sur le ticket
- utile pour l'audit et la demonstration

Endpoint:

```text
GET /api/reclamations/{id}/history
```

Body Postman:

```text
Pas de body
```

## 11. Ajout d'un message client

Explication:

- permet au client de repondre sur la reclamation
- met a jour l'activite du dossier
- peut relancer le workflow

Endpoint:

```text
POST /api/reclamations/{id}/messages
```

Body Postman:

```json
{
  "authorUserId": 1,
  "visibility": "CUSTOMER",
  "message": "Bonjour, je confirme que le paiement a bien ete debite de mon compte."
}
```

## 12. Ajout d'une note interne agent

Explication:

- permet a l'agent d'ajouter une note interne non visible par le client
- utile pour les commentaires internes ou techniques

Endpoint:

```text
POST /api/reclamations/{id}/messages
```

Body Postman:

```json
{
  "authorUserId": 2,
  "visibility": "INTERNAL",
  "message": "Verification en cours avec l'equipe comptable pour le rapprochement bancaire."
}
```

## 13. Consultation des messages

Explication:

- liste tous les messages du dossier
- avec `includeInternal=true`, les notes internes sont incluses

Endpoint:

```text
GET /api/reclamations/{id}/messages?includeInternal=false
GET /api/reclamations/{id}/messages?includeInternal=true
```

Body Postman:

```text
Pas de body
```

## 14. Ajout de piece jointe

Explication:

- permet d'ajouter une capture d'ecran, un PDF ou un justificatif
- le fichier est envoye en multipart form-data
- le dossier est mis a jour dans l'historique

Endpoint:

```text
POST /api/reclamations/{id}/attachments
```

Important:

- ne pas utiliser `raw JSON`
- utiliser `Body > form-data`
- `uploadedByUserId` doit etre en `Text`
- `file` doit etre en `File`

Body Postman:

```text
Type: form-data

uploadedByUserId   10      Text
file               choisir un vrai fichier     File
```

Exemple d'URL:

```text
POST /api/reclamations/1/attachments
```

## 15. Consultation des pieces jointes

Explication:

- liste tous les fichiers rattaches a la reclamation

Endpoint:

```text
GET /api/reclamations/{id}/attachments
```

Body Postman:

```text
Pas de body
```

## 16. Detection de doublons

Explication:

- retourne les reclamations similaires pour un meme utilisateur
- utile pour eviter les tickets dupliques

Endpoint:

```text
GET /api/reclamations/{id}/duplicates
```

Body Postman:

```text
Pas de body
```

## 17. Feedback et satisfaction client

Explication:

- permet au client de noter la qualite du traitement
- enregistre la note et le commentaire
- utile pour les KPI et la qualite de service

Endpoint:

```text
POST /api/reclamations/{id}/feedback
```

Body Postman:

```json
{
  "actorUserId": 1,
  "customerSatisfactionScore": 5,
  "customerFeedback": "Traitement rapide, clair et professionnel."
}
```

## 18. Dashboard KPI

Explication:

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

Endpoint:

```text
GET /api/reclamations/dashboard
```

Body Postman:

```text
Pas de body
```

## Fonctionnalites automatiques importantes a expliquer devant le professeur

- categorisation automatique
- calcul du score de risque ML
- niveau de risque LOW, MEDIUM, HIGH, CRITICAL
- priorisation intelligente
- initialisation automatique du SLA
- notification automatique lors des changements importants
- auto-escalade si le score ML est eleve
- auto-escalade si le SLA est depasse
- historique complet et audit du dossier

## Ordre de demonstration recommande sur Postman

## Etape 1 - Creer une reclamation

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

## Etape 2 - Consulter la reclamation creee

```text
GET /api/reclamations/1
```

## Etape 3 - Affecter la reclamation a un agent

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

## Etape 4 - Ajouter une note interne

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

## Etape 5 - Ajouter une piece jointe

```text
POST /api/reclamations/1/attachments
```

Form-data:

```text
uploadedByUserId   10      Text
file               choisir un vrai fichier     File
```

## Etape 6 - Passer en attente client

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

## Etape 7 - Le client repond

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

## Etape 8 - Resoudre la reclamation

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

## Etape 9 - Ajouter le feedback client

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

## Etape 10 - Montrer les KPI et l'historique

```text
GET /api/reclamations/dashboard
GET /api/reclamations/1/history
GET /api/reclamations/1/messages?includeInternal=true
GET /api/reclamations/1/attachments
GET /api/reclamations/1/duplicates
```

## Remarques importantes pour la soutenance

- pour les endpoints `GET`, il n'y a pas de body
- pour `attachments`, il faut obligatoirement utiliser `form-data`
- les IDs utilises dans les exemples doivent exister dans votre base
- si un user ID ou une reclamation n'existe pas, vous aurez une erreur
- pour une belle demo, commencez par la creation, puis l'affectation, puis le workflow, puis le feedback, puis le dashboard
