# KREDIA - API Endpoints Investissement

**Base URL:** `http://localhost:8081`

---

## 1. InvestmentController — `/api/investments`

## 1.1 Assets

### POST `/api/investments/assets`
Créer un nouvel actif d'investissement.

**Body:**
```json
{
  "symbol": "AAPL",
  "assetName": "Apple Inc.",
  "category": "STOCK",
  "riskLevel": "MEDIUM"
}
```

**Valeurs `category` :** `STOCK` | `CRYPTO` | `BOND` | `ETF` | `COMMODITY`

**Valeurs `riskLevel` :** `LOW` | `MEDIUM` | `HIGH` | `VERY_HIGH`

---

### GET `/api/investments/assets/{id}`
Récupérer un actif par ID. Pas de body.

---

### GET `/api/investments/assets`
Récupérer tous les actifs. Pas de body.

---

### PUT `/api/investments/assets/{id}`
Mettre à jour un actif.

**Body:**
```json
{
  "symbol": "AAPL",
  "assetName": "Apple Inc. Updated",
  "category": "STOCK",
  "riskLevel": "LOW"
}
```

---

### DELETE `/api/investments/assets/{id}`
Supprimer un actif. Pas de body.

---

### GET `/api/investments/assets/symbol/{symbol}`
Récupérer un actif par symbole. Pas de body.

---

### GET `/api/investments/assets/category/{category}`
Filtrer les actifs par catégorie. Pas de body.

---

### GET `/api/investments/assets/risk/{riskLevel}`
Filtrer les actifs par niveau de risque. Pas de body.

---

## 1.2 Orders

### POST `/api/investments/orders`
Créer un ordre d'investissement.

**Body:**
```json
{
  "user": {
    "id": 1
  },
  "assetSymbol": "AAPL",
  "orderType": "BUY",
  "quantity": 10,
  "price": 182.50,
  "orderStatus": "PENDING"
}
```

**Valeurs `orderType` :** `BUY` | `SELL` | `HOLD`

**Valeurs `orderStatus` :** `PENDING` | `EXECUTED` | `CANCELLED` | `PARTIALLY_FILLED`

---

### GET `/api/investments/orders/{id}`
Récupérer un ordre par ID. Pas de body.

---

### GET `/api/investments/orders`
Récupérer tous les ordres. Pas de body.

---

### PUT `/api/investments/orders/{id}`
Mettre à jour un ordre.

**Body:**
```json
{
  "user": {
    "id": 1
  },
  "assetSymbol": "AAPL",
  "orderType": "SELL",
  "quantity": 5,
  "price": 190.00,
  "orderStatus": "PENDING"
}
```

---

### DELETE `/api/investments/orders/{id}`
Supprimer un ordre. Pas de body.

---

### GET `/api/investments/orders/user/{userId}`
Récupérer les ordres d'un utilisateur. Pas de body.

---

### GET `/api/investments/orders/asset/{assetSymbol}`
Récupérer les ordres d'un actif. Pas de body.

---

### GET `/api/investments/orders/status/{status}`
Récupérer les ordres par statut. Pas de body.

---

### GET `/api/investments/orders/user/{userId}/status/{status}`
Récupérer les ordres d'un utilisateur par statut. Pas de body.

---

## 1.3 Strategies

### POST `/api/investments/strategies`
Créer une stratégie d'investissement.

**Body:**
```json
{
  "user": {
    "id": 1
  },
  "strategyName": "Stratégie Conservatrice",
  "maxBudget": 5000,
  "stopLossPct": 8.5,
  "reinvestProfits": true,
  "isActive": true
}
```

---

### GET `/api/investments/strategies/{id}`
Récupérer une stratégie par ID. Pas de body.

---

### GET `/api/investments/strategies`
Récupérer toutes les stratégies. Pas de body.

---

### PUT `/api/investments/strategies/{id}`
Mettre à jour une stratégie.

**Body:**
```json
{
  "user": {
    "id": 1
  },
  "strategyName": "Stratégie Dynamique",
  "maxBudget": 10000,
  "stopLossPct": 12,
  "reinvestProfits": false,
  "isActive": true
}
```

---

### DELETE `/api/investments/strategies/{id}`
Supprimer une stratégie. Pas de body.

---

### GET `/api/investments/strategies/user/{userId}`
Récupérer les stratégies d'un utilisateur. Pas de body.

---

### GET `/api/investments/strategies/active/{isActive}`
Récupérer les stratégies par état actif/inactif. Pas de body.

---

### GET `/api/investments/strategies/user/{userId}/active/{isActive}`
Récupérer les stratégies d'un utilisateur par état actif/inactif. Pas de body.

---

## 1.4 Portfolio Positions

### POST `/api/investments/positions`
Créer une position portefeuille (prix récupéré automatiquement via API de marché).

**Body:**
```json
{
  "userId": 1,
  "assetSymbol": "AAPL",
  "quantity": 3.5
}
```

---

### GET `/api/investments/positions/{id}`
Récupérer une position par ID (avec profit calculé). Pas de body.

---

### GET `/api/investments/positions`
Récupérer toutes les positions (avec profit calculé). Pas de body.

---

### PUT `/api/investments/positions/{id}`
Mettre à jour une position.

**Body:**
```json
{
  "assetSymbol": "AAPL",
  "currentQuantity": 5,
  "avgPurchasePrice": 170.00
}
```

---

### DELETE `/api/investments/positions/{id}`
Supprimer une position. Pas de body.

---

### GET `/api/investments/positions/user/{userId}`
Récupérer les positions d'un utilisateur (avec profit calculé). Pas de body.

---

### GET `/api/investments/positions/asset/{assetId}`
Récupérer les positions d'un actif. Pas de body.

---

### GET `/api/investments/positions/user/{userId}/asset/{assetSymbol}`
Récupérer la position d'un utilisateur pour un actif donné. Pas de body.

---

## 1.5 AI Market Insight

### POST `/api/investments/market-strategy-summary`
Générer un résumé stratégique de marché via IA.

**Body (optionnel):**
```json
{
  "language": "fr",
  "tone": "professionnel",
  "additionalContext": "Portefeuille orienté ETF et obligations"
}
```

**Réponse (exemple):**
```json
{
  "status": "success",
  "summary": "Le marché montre une volatilité modérée...",
  "generatedAt": "2026-03-30T09:20:00"
}
```

---

## 2. OrderExecutionController — `/api/order-execution`

### POST `/api/order-execution/notify`
Notifier l'exécution d'un ordre (envoi d'email utilisateur).

**Body:**
```json
{
  "orderId": 1,
  "userId": 1,
  "assetSymbol": "AAPL",
  "orderType": "BUY",
  "quantity": 2,
  "executedPrice": 188.35,
  "executedAt": "2026-03-30T10:15:00"
}
```

**Réponse (succès):**
```text
Email notification sent successfully
```

---

## Résumé des endpoints investissement

| Méthode | Endpoint | Body |
|---------|----------|------|
| POST | `/api/investments/assets` | ✅ |
| GET | `/api/investments/assets/{id}` | ❌ |
| GET | `/api/investments/assets` | ❌ |
| PUT | `/api/investments/assets/{id}` | ✅ |
| DELETE | `/api/investments/assets/{id}` | ❌ |
| GET | `/api/investments/assets/symbol/{symbol}` | ❌ |
| GET | `/api/investments/assets/category/{category}` | ❌ |
| GET | `/api/investments/assets/risk/{riskLevel}` | ❌ |
| POST | `/api/investments/orders` | ✅ |
| GET | `/api/investments/orders/{id}` | ❌ |
| GET | `/api/investments/orders` | ❌ |
| PUT | `/api/investments/orders/{id}` | ✅ |
| DELETE | `/api/investments/orders/{id}` | ❌ |
| GET | `/api/investments/orders/user/{userId}` | ❌ |
| GET | `/api/investments/orders/asset/{assetSymbol}` | ❌ |
| GET | `/api/investments/orders/status/{status}` | ❌ |
| GET | `/api/investments/orders/user/{userId}/status/{status}` | ❌ |
| POST | `/api/investments/strategies` | ✅ |
| GET | `/api/investments/strategies/{id}` | ❌ |
| GET | `/api/investments/strategies` | ❌ |
| PUT | `/api/investments/strategies/{id}` | ✅ |
| DELETE | `/api/investments/strategies/{id}` | ❌ |
| GET | `/api/investments/strategies/user/{userId}` | ❌ |
| GET | `/api/investments/strategies/active/{isActive}` | ❌ |
| GET | `/api/investments/strategies/user/{userId}/active/{isActive}` | ❌ |
| POST | `/api/investments/positions` | ✅ |
| GET | `/api/investments/positions/{id}` | ❌ |
| GET | `/api/investments/positions` | ❌ |
| PUT | `/api/investments/positions/{id}` | ✅ |
| DELETE | `/api/investments/positions/{id}` | ❌ |
| GET | `/api/investments/positions/user/{userId}` | ❌ |
| GET | `/api/investments/positions/asset/{assetId}` | ❌ |
| GET | `/api/investments/positions/user/{userId}/asset/{assetSymbol}` | ❌ |
| POST | `/api/investments/market-strategy-summary` | ✅ (optionnel) |
| POST | `/api/order-execution/notify` | ✅ |
