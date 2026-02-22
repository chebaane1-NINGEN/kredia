# Test de Vérification Stricte KYC

## Changements Effectués

### 1. Logique de Vérification STRICTE
- ✅ La réponse DOIT commencer par `APPROVED:` pour être approuvée
- ✅ Tout le reste est REJETÉ (y compris erreurs, réponses ambiguës)
- ✅ En cas d'erreur API, le document est REJETÉ (pas approuvé par défaut)
- ✅ Logs détaillés montrent la réponse EXACTE de Gemini

### 2. Prompt Gemini Renforcé
- ✅ Vérification en 2 étapes: d'abord type d'image, puis critères du document
- ✅ Liste explicite des types d'images à rejeter (paysages, nourriture, etc.)
- ✅ Instructions claires avec emojis pour attirer l'attention
- ✅ Format de réponse obligatoire: `APPROVED:` ou `REJECTED:`

## Tests à Effectuer

### Test 1: Image Paysage Cloudinary (DOIT être REJECTED)
```json
POST http://localhost:8081/api/kyc-loans/create-from-url
{
  "credit_id": 6,
  "user_id": 1,
  "document_type": "INCOME_PROOF",
  "document_path": "https://res.cloudinary.com/Root/image/upload/photo-1506905925346-21bda4d32df4_vkkaoe.jpg"
}
```
**Résultat Attendu**: `verified_status: REJECTED`

### Test 2: Image Paysage Unsplash (DOIT être REJECTED)
```json
POST http://localhost:8081/api/kyc-loans/create-from-url
{
  "credit_id": 6,
  "user_id": 1,
  "document_type": "INCOME_PROOF",
  "document_path": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&blur=50"
}
```
**Résultat Attendu**: `verified_status: REJECTED`

### Test 3: Vrai Document (DOIT être APPROVED)
```json
POST http://localhost:8081/api/kyc-loans/create-from-url
{
  "credit_id": 6,
  "user_id": 1,
  "document_type": "INCOME_PROOF",
  "document_path": "https://res.cloudinary.com/Root/raw/upload/fiche_ondcyh.pdf"
}
```
**Résultat Attendu**: `verified_status: APPROVED`

## Comment Vérifier

1. **Redémarrer l'application**
   ```bash
   mvn spring-boot:run
   ```

2. **Créer un document avec Postman**
   - Utiliser l'endpoint `POST /api/kyc-loans/create-from-url`
   - Attendre 2-3 secondes pour la vérification async

3. **Vérifier le statut**
   ```
   GET http://localhost:8081/api/kyc-loans/{id}
   ```

4. **Consulter les logs**
   - Chercher: `Gemini EXACT response for KycLoan`
   - Vérifier que la réponse commence par `APPROVED:` ou `REJECTED:`

## Logs à Surveiller

```
=== ASYNC VERIFICATION START for KycLoan X ===
Document URL: ...
Document Type: INCOME_PROOF
Gemini EXACT response for KycLoan X: 'REJECTED: Ceci n'est pas un document officiel'
KycLoan X set to REJECTED - Response: REJECTED: ...
=== ASYNC VERIFICATION COMPLETE for KycLoan X - Status: REJECTED ===
```

## Comportement Attendu

| Type d'Image | Résultat | Raison |
|--------------|----------|--------|
| Paysage | REJECTED | Pas un document officiel |
| Nourriture | REJECTED | Pas un document officiel |
| Animal | REJECTED | Pas un document officiel |
| Document flou | REJECTED | Texte non lisible |
| Document sans info | REJECTED | Critères manquants |
| Vrai document complet | APPROVED | Tous les critères OK |

## En Cas de Problème

Si un paysage est encore APPROVED:
1. Vérifier les logs pour voir la réponse exacte de Gemini
2. Copier la réponse ici pour analyse
3. Peut-être que Gemini a besoin d'exemples plus explicites
