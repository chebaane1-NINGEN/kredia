# KREDIA - API Endpoints Documentation

**Base URL:** `http://localhost:8081`

---

## 1. ChatbotController — `/api/chatbot`

### POST `/api/chatbot/recommend-repayment`
Recommande le meilleur type de remboursement via Gemini AI.

**Valeurs repaymentType :**

| Valeur | Description                                                                                                                                                        |
|--------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `AMORTISSEMENT_CONSTANT` | je veux rembourser une part fixe du capital emprunté chaque mois. Les intérêts diminuent avec le temps, donc les mensualités baissent progressivement.             |
| `MENSUALITE_CONSTANTE` | je veux payer  exactement le même montant total chaque mois (capital + intérêts cumulés). La part d'intérêts diminue et la part de capital augmente avec le temps. |
| `IN_FINE` | je ne veux pas payer que les intérêts, et rembourse l'intégralité du capital en une seule fois à la fin.                                                           |
**Body:**
```json
{
  "description": "Le client rembourse une part fixe du capital emprunté chaque mois. Les intérêts diminuent avec le temps, donc les mensualités baissent progressivement."
}


```

**Réponse:**
```json
{
  "recommendation": "MENSUALITE_CONSTANTE — recommandé pour votre profil..."
}
```

---

## 2. CreditController — `/api/credits`

### POST `/api/credits`
Créer un nouveau crédit.

**Body:**
```json
{
  "userId": 1,
  "amount": 10000.00,
  "interestRate": 5.5,
  "startDate": "2026-02-01",
  "endDate": "2027-02-01",
  "termMonths": 12,
  "repaymentType": "MENSUALITE_CONSTANTE",
  "income": 3000.00,
  "dependents": 2
}
```
---

### GET `/api/credits`
Récupérer tous les crédits. Pas de body.

---

### GET `/api/credits/{id}`
Récupérer un crédit par ID. Pas de body.

---

### PUT `/api/credits/{id}`
Mettre à jour un crédit.


```json
{
  "userId": 1,
  "amount": 15000.00,
  "interestRate": 6.0,
  "startDate": "2026-03-01",
  "endDate": "2028-03-01",
  "termMonths": 24,
  "repaymentType": "AMORTISSEMENT_CONSTANT",
  "income": 3500.00,
  "dependents": 1
}
```

---

### DELETE `/api/credits/{id}`
Supprimer un crédit. Pas de body.

---

### GET `/api/credits/{id}/export`
Exporter le crédit en fichier Excel (.xlsx). Pas de body.

**Réponse:** Fichier binaire `credit_{id}.xlsx`

---

### GET `/api/credits/{id}/statistics/pdf`
Générer un rapport statistique PDF. Pas de body.

**Réponse:** Fichier binaire `statistiques_credit_{id}.pdf`

---

### POST `/api/credits/{id}/predict-default`
Prédire le risque de défaut de paiement via le modèle ML. Pas de body.

**Réponse:**
```json
{
  "credit_id": 14,
  "default_probability": 0.3536,
  "risk_label": "RISQUE_MOYEN",
  "risk_level": "MEDIUM",
  "recommendation": "Surveillance recommandée. Vérifier les revenus et charges."
}
```

**Niveaux de risque:**
| Probabilité | Label | Signification |
|-------------|-------|---------------|
| 0.00 - 0.35 | RISQUE_FAIBLE | Crédit accordable |
| 0.35 - 0.55 | RISQUE_MOYEN | Surveillance requise |
| 0.55 - 1.00 | RISQUE_ÉLEVÉ | Analyse approfondie |

> Nécessite le microservice Python actif sur `http://localhost:8001`

---

## 3. EcheanceController — `/api/echeances`

### GET `/api/echeances`
Récupérer toutes les échéances. Pas de body.

---

### GET `/api/echeances/{id}`
Récupérer une échéance par ID. Pas de body.

---

### PUT `/api/echeances/{echeanceId}/pay`
Effectuer un paiement sur une échéance.

**Body:**
```json
{
  "amount": 1000
}
```

**Réponse:**
```json
{
  "echeance": { 
    "id": 1,
    "creditId": 5,
    "echeanceNumber": 1,
    "amountDue": 858.37,
    "status": "PARTIALLY_PAID",
    "paid_at": "2026-03-29T14:30:00",
    "...": "..."
  },
  "isPartialPayment": true,
  "message": "Paiement partiel effectué. Montant payé: 500.00",
  "amountPaid": 500.00,
  "remainingAmount": 358.37
}
```

**Comportement de `paid_at`:**
- **Mis à jour à chaque paiement** : Le champ `paid_at` se met à jour avec la date et l'heure du paiement (partiellement ou totalement)
- **N'existe que lors d'un paiement** : Le champ est absent ou null tant qu'aucun paiement n'a été effectué
- **Ne change pas au paiement total** : Une fois le paiement totalement complété (status = `FULLY_PAID`), `paid_at` conserve la date du dernier paiement effectué
- **Exemple de transitions** :
  - Paiement partiel 1 : `paid_at: 2026-03-20T10:00:00`, status: `PARTIALLY_PAID`
  - Paiement partiel 2 : `paid_at: 2026-03-25T15:30:00`, status: `PARTIALLY_PAID` (mise à jour)
  - Paiement final : `paid_at: 2026-03-29T14:30:00`, status: `FULLY_PAID` (mise à jour finale)

---

## 4. KycLoanController — `/api/kyc-loans`

### POST `/api/kyc-loans/upload`
Uploader un document KYC (multipart/form-data).

**Form-data params:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| creditId | Long | ID du crédit |
| userId | Long | ID de l'utilisateur |
| documentType | String | Type de document |
| file | File | Fichier à uploader |

**Valeurs documentType:** `IDENTITY_CARD` | `PROOF_OF_INCOME` | `BANK_STATEMENT` | `EMPLOYMENT_CONTRACT` | `TAX_RETURN`

---

### POST `/api/kyc-loans/credits/{creditId}/create-from-url`
Créer un document KYC depuis une URL.

**Body:**
```json
{
  "document_type": "INCOME_PROOF",
  "document_path": "https://res.cloudinary.com/dzvyxpkbf/image/upload/v1771772503/ATTESTATION.docx_jjguaq"
}

```
https://res.cloudinary.com/dzvyxpkbf/image/upload/v1771772503/photo-1506905925346-21bda4d32df4_vkkaoe.jpg

### GET `/api/kyc-loans/credit/{creditId}`
Récupérer tous les documents d'un crédit. Pas de body.

---

### GET `/api/kyc-loans/{kycLoanId}`
Récupérer un document par ID. Pas de body.

---

### PUT `/api/kyc-loans/{kycLoanId}/verify`
Forcer la vérification d'un document. Pas de body.

**Réponse:**
```json
{
  "kycLoanId": 1,
  "creditId": 5,
  "userId": 123,
  "documentType": "IDENTITY_CARD",
  "documentPath": "https://...",
  "submittedAt": "2026-03-24T15:00:00",
  "verifiedStatus": "APPROVED"
}
```

---

## Résumé des endpoints

| Méthode | Endpoint | Body |
|---------|----------|------|
| POST | `/api/chatbot/recommend-repayment` | ✅ |
| POST | `/api/credits` | ✅ |
| GET | `/api/credits` | ❌ |
| GET | `/api/credits/{id}` | ❌ |
| PUT | `/api/credits/{id}` | ✅ |
| DELETE | `/api/credits/{id}` | ❌ |
| GET | `/api/credits/{id}/export` | ❌ |
| GET | `/api/credits/{id}/statistics/pdf` | ❌ |
| POST | `/api/credits/{id}/predict-default` | ❌ |
| GET | `/api/echeances` | ❌ |
| GET | `/api/echeances/{id}` | ❌ |
| PUT | `/api/echeances/{echeanceId}/pay` | ✅ |
| POST | `/api/kyc-loans/upload` | form-data |
| POST | `/api/kyc-loans/create-from-url` | ✅ |
| GET | `/api/kyc-loans/credit/{creditId}` | ❌ |
| GET | `/api/kyc-loans/{kycLoanId}` | ❌ |
| PUT | `/api/kyc-loans/{kycLoanId}/verify` | ❌ |
## Eport et Pdf
4
44
40
## Prediction
16
44
40
