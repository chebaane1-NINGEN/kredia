# Order Execution Service - Microservice d'exécution des ordres

Microservice Python FastAPI pour surveiller et exécuter automatiquement les ordres d'investissement lorsque le prix cible est atteint.

## 🚀 Fonctionnalités

- ✅ Surveillance automatique des ordres en attente (PENDING)
- ✅ Vérification périodique des prix via Alpha Vantage API
- ✅ Exécution automatique des ordres BUY/SELL au prix cible
- ✅ Mise à jour automatique du portfolio utilisateur
- ✅ Gestion des positions avec calcul du prix moyen pondéré
- ✅ API REST pour monitoring et contrôle manuel
- ✅ Cache des prix pour limiter les appels API

## 📋 Prérequis

- Python 3.11+
- MySQL (base de données Kredia)
- Docker (optionnel)
- Clé API Alpha Vantage

## 🔧 Installation locale

### 1. Créer un environnement virtuel

```bash
cd order-execution-service
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows
```

### 2. Installer les dépendances

```bash
pip install -r requirements.txt
```

### 3. Configuration

Créer un fichier `.env` à partir de `.env.example`:

```bash
cp .env.example .env
```

Modifier les valeurs selon votre configuration.

### 4. Lancer le service

```bash
# Mode développement
uvicorn main:app --reload --port 8002

# Mode production
python main.py
```

## 🐳 Installation avec Docker

### 1. Build l'image

```bash
docker build -t kredia-order-execution .
```

### 2. Lancer avec Docker Compose

```bash
docker-compose up -d
```

### 3. Voir les logs

```bash
docker-compose logs -f
```

### 4. Arrêter le service

```bash
docker-compose down
```

## 📡 Endpoints API

### Informations générales

- **GET** `/` - Informations sur le service
- **GET** `/health` - Vérification de santé
- **GET** `/docs` - Documentation Swagger interactive

### Monitoring

- **GET** `/monitoring/status` - Statut du service de surveillance
  ```json
  {
    "enabled": true,
    "interval_seconds": 60,
    "pending_orders_count": 5,
    "last_check": "2026-03-02T10:30:00"
  }
  ```

- **POST** `/monitoring/check-now` - Déclencher une vérification manuelle

### Prix du marché

- **GET** `/price/{symbol}` - Obtenir le prix actuel d'un symbole
  ```json
  {
    "symbol": "AAPL",
    "price": 175.50,
    "timestamp": "2026-03-02T10:30:00",
    "source": "Alpha Vantage"
  }
  ```

### Gestion des ordres

- **GET** `/orders/pending` - Liste des ordres en attente
- **POST** `/orders/{order_id}/execute` - Forcer l'exécution d'un ordre

## 🔄 Logique d'exécution

### Ordres d'achat (BUY)
- Exécuté quand: **Prix du marché ≤ Prix cible**
- Exemple: Ordre d'achat à 100€ → exécuté si prix atteint 100€ ou moins

### Ordres de vente (SELL)
- Exécuté quand: **Prix du marché ≥ Prix cible**
- Exemple: Ordre de vente à 200€ → exécuté si prix atteint 200€ ou plus

### Mise à jour du portfolio

**Achat:**
- Nouvelle position: Créée avec le prix d'exécution
- Position existante: Quantité ajoutée, prix moyen pondéré recalculé

**Vente:**
- Quantité réduite de la position
- Position supprimée si quantité = 0

## 🔧 Configuration

### Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `DATABASE_URL` | URL de connexion MySQL | `mysql+pymysql://root:password@localhost:3306/kredia_db` |
| `ALPHA_VANTAGE_API_KEY` | Clé API Alpha Vantage | `ACH9TF7OZXXUFNH0` |
| `MONITORING_INTERVAL` | Intervalle de vérification (secondes) | `60` |
| `SERVICE_PORT` | Port du service | `8002` |

### Limites API Alpha Vantage

- **Gratuit:** 5 appels/minute, 500 appels/jour
- Cache intégré pour réduire les appels
- Durée du cache: 60 secondes par défaut

## 📊 Logs

Le service génère des logs détaillés:

```
INFO - Démarrage de la boucle de surveillance des ordres
INFO - Vérification de 10 ordres en attente
INFO - Prix de AAPL récupéré de l'API: 175.50
INFO - Exécution de l'ordre 123: BUY AAPL @ 175.50
INFO - Ordre 123 exécuté avec succès à 175.50
```

## 🧪 Tests

### Test manuel avec curl

```bash
# Vérifier le statut
curl http://localhost:8002/health

# Obtenir un prix
curl http://localhost:8002/price/AAPL

# Déclencher une vérification
curl -X POST http://localhost:8002/monitoring/check-now

# Lister les ordres en attente
curl http://localhost:8002/orders/pending
```

### Documentation interactive

Accéder à: `http://localhost:8002/docs`

## 🔒 Sécurité

- ⚠️ Ajouter une authentification pour la production
- ⚠️ Utiliser HTTPS en production
- ⚠️ Protéger les clés API dans des secrets
- ⚠️ Limiter les CORS en production

## 🐛 Dépannage

### Erreur de connexion à la base de données

```bash
# Vérifier que MySQL est accessible
mysql -h localhost -u root -p kredia_db
```

### Le service ne trouve pas les ordres

```bash
# Vérifier les données en base
SELECT * FROM investment_orders WHERE order_status = 'PENDING';
```

### Les prix ne sont pas récupérés

- Vérifier la clé API Alpha Vantage
- Vérifier les limites d'appels API
- Consulter les logs pour les erreurs

## 🔗 Intégration avec Kredia

Le service s'intègre avec:
- **Kredia Backend (Java)** - Port 8081
- **Base de données MySQL** - Port 3306
- **Alpha Vantage API** - API externe

## 📝 TODO / Améliorations futures

- [ ] Support WebSocket pour notifications temps réel
- [ ] Support de plusieurs sources de prix (Binance, CoinGecko)
- [ ] Système de retry avec backoff exponentiel
- [ ] Métriques Prometheus
- [ ] Tests unitaires et d'intégration
- [ ] Support des ordres stop-loss et take-profit
- [ ] Notification par email/SMS lors de l'exécution
- [ ] Dashboard de monitoring
