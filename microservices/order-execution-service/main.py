"""
Microservice de surveillance et d'exécution automatique des ordres d'investissement
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum
import asyncio
import httpx
import logging
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Numeric, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from contextlib import asynccontextmanager
import os
from decimal import Decimal

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration de la base de données
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:Ningen@2024@localhost:3306/kredia_db"
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Configuration Alpha Vantage
ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY", "ACH9TF7OZXXUFNH0")
ALPHA_VANTAGE_URL = "https://www.alphavantage.co/query"

# Configuration du monitoring
MONITORING_INTERVAL = int(os.getenv("MONITORING_INTERVAL", "60"))  # secondes
MONITORING_ENABLED = True


# Enums
class OrderType(str, Enum):
    BUY = "BUY"
    SELL = "SELL"
    HOLD = "HOLD"


class OrderStatus(str, Enum):
    PENDING = "PENDING"
    EXECUTED = "EXECUTED"
    CANCELLED = "CANCELLED"
    PARTIALLY_FILLED = "PARTIALLY_FILLED"


# Modèles SQLAlchemy
class InvestmentOrder(Base):
    __tablename__ = "investment_orders"

    order_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    asset_id = Column(Integer, nullable=False, index=True)
    order_type = Column(SQLEnum(OrderType), nullable=False)
    quantity = Column(Numeric(15, 8), nullable=False)
    price = Column(Numeric(15, 2))
    order_status = Column(SQLEnum(OrderStatus), nullable=False, default=OrderStatus.PENDING)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    executed_at = Column(DateTime)


class InvestmentAsset(Base):
    __tablename__ = "investment_assets"

    asset_id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False, unique=True, index=True)
    asset_name = Column(String(200), nullable=False)


class PortfolioPosition(Base):
    __tablename__ = "portfolio_positions"

    position_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    asset_symbol = Column(String(20), nullable=False)
    current_quantity = Column(Numeric(15, 8), nullable=False)
    avg_purchase_price = Column(Numeric(15, 2), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


# Modèles Pydantic
class OrderExecutionResponse(BaseModel):
    order_id: int
    status: str
    message: str
    executed_at: Optional[datetime] = None
    execution_price: Optional[float] = None


class MonitoringStatus(BaseModel):
    enabled: bool
    interval_seconds: int
    pending_orders_count: int
    last_check: Optional[datetime] = None


class PriceInfo(BaseModel):
    symbol: str
    price: float
    timestamp: datetime
    source: str


# Service de récupération des prix
class MarketPriceService:
    """Service pour récupérer les prix du marché via Alpha Vantage"""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.cache = {}  # Cache simple pour éviter trop d'appels API
        self.cache_duration = 60  # secondes

    async def get_current_price(self, symbol: str) -> Optional[float]:
        """Récupère le prix actuel d'un symbole"""
        try:
            # Vérifier le cache
            if symbol in self.cache:
                cached_data, timestamp = self.cache[symbol]
                if (datetime.utcnow() - timestamp).seconds < self.cache_duration:
                    logger.info(f"Prix de {symbol} récupéré du cache: {cached_data}")
                    return cached_data

            # Appel API Alpha Vantage
            async with httpx.AsyncClient(timeout=10.0) as client:
                params = {
                    "function": "GLOBAL_QUOTE",
                    "symbol": symbol,
                    "apikey": self.api_key
                }
                response = await client.get(ALPHA_VANTAGE_URL, params=params)
                response.raise_for_status()
                data = response.json()

                if "Global Quote" in data and "05. price" in data["Global Quote"]:
                    price = float(data["Global Quote"]["05. price"])
                    self.cache[symbol] = (price, datetime.utcnow())
                    logger.info(f"Prix de {symbol} récupéré de l'API: {price}")
                    return price
                else:
                    logger.warning(f"Format de réponse inattendu pour {symbol}: {data}")
                    return None

        except Exception as e:
            logger.error(f"Erreur lors de la récupération du prix pour {symbol}: {str(e)}")
            return None


# Service d'exécution des ordres
class OrderExecutionService:
    """Service pour surveiller et exécuter les ordres automatiquement"""

    def __init__(self, price_service: MarketPriceService):
        self.price_service = price_service
        self.last_check_time = None

    def get_db(self) -> Session:
        """Crée une session de base de données"""
        return SessionLocal()

    async def check_and_execute_pending_orders(self) -> List[OrderExecutionResponse]:
        """Vérifie tous les ordres en attente et les exécute si le prix est atteint"""
        db = self.get_db()
        results = []

        try:
            # Récupérer tous les ordres en attente
            pending_orders = db.query(InvestmentOrder).filter(
                InvestmentOrder.order_status == OrderStatus.PENDING,
                InvestmentOrder.price.isnot(None)  # Seulement les ordres avec un prix cible
            ).all()

            logger.info(f"Vérification de {len(pending_orders)} ordres en attente")
            self.last_check_time = datetime.utcnow()

            for order in pending_orders:
                try:
                    result = await self.check_and_execute_order(db, order)
                    if result:
                        results.append(result)
                except Exception as e:
                    logger.error(f"Erreur lors de la vérification de l'ordre {order.order_id}: {str(e)}")

            db.commit()
            return results

        except Exception as e:
            logger.error(f"Erreur globale lors de la vérification des ordres: {str(e)}")
            db.rollback()
            return results
        finally:
            db.close()

    async def check_and_execute_order(self, db: Session, order: InvestmentOrder) -> Optional[OrderExecutionResponse]:
        """Vérifie et exécute un ordre individuel si les conditions sont remplies"""
        try:
            # Récupérer l'asset pour obtenir le symbole
            asset = db.query(InvestmentAsset).filter(
                InvestmentAsset.asset_id == order.asset_id
            ).first()

            if not asset:
                logger.warning(f"Asset non trouvé pour l'ordre {order.order_id}")
                return None

            # Récupérer le prix actuel du marché
            current_price = await self.price_service.get_current_price(asset.symbol)
            if current_price is None:
                logger.warning(f"Impossible de récupérer le prix pour {asset.symbol}")
                return None

            # Vérifier si l'ordre doit être exécuté
            should_execute = self._should_execute_order(order, current_price)

            if should_execute:
                logger.info(f"Exécution de l'ordre {order.order_id}: {order.order_type} {asset.symbol} @ {current_price}")
                return await self._execute_order(db, order, asset, current_price)

            return None

        except Exception as e:
            logger.error(f"Erreur lors de la vérification de l'ordre {order.order_id}: {str(e)}")
            return None

    def _should_execute_order(self, order: InvestmentOrder, current_price: float) -> bool:
        """Détermine si un ordre doit être exécuté en fonction du prix actuel"""
        target_price = float(order.price)

        if order.order_type == OrderType.BUY:
            # Acheter si le prix actuel est inférieur ou égal au prix cible
            return current_price <= target_price
        elif order.order_type == OrderType.SELL:
            # Vendre si le prix actuel est supérieur ou égal au prix cible
            return current_price >= target_price

        return False

    async def _execute_order(
        self,
        db: Session,
        order: InvestmentOrder,
        asset: InvestmentAsset,
        execution_price: float
    ) -> OrderExecutionResponse:
        """Exécute un ordre et met à jour le portfolio"""
        try:
            # Mettre à jour le statut de l'ordre
            order.order_status = OrderStatus.EXECUTED
            order.executed_at = datetime.utcnow()
            order.price = Decimal(str(execution_price))  # Mettre à jour avec le prix d'exécution réel

            # Mettre à jour ou créer la position dans le portfolio
            await self._update_portfolio(db, order, asset, execution_price)

            db.commit()

            logger.info(f"Ordre {order.order_id} exécuté avec succès à {execution_price}")

            return OrderExecutionResponse(
                order_id=order.order_id,
                status="EXECUTED",
                message=f"Ordre exécuté avec succès: {order.order_type} {float(order.quantity)} {asset.symbol}",
                executed_at=order.executed_at,
                execution_price=execution_price
            )

        except Exception as e:
            logger.error(f"Erreur lors de l'exécution de l'ordre {order.order_id}: {str(e)}")
            db.rollback()
            raise

    async def _update_portfolio(
        self,
        db: Session,
        order: InvestmentOrder,
        asset: InvestmentAsset,
        execution_price: float
    ):
        """Met à jour le portfolio de l'utilisateur après l'exécution d'un ordre"""
        try:
            # Rechercher la position existante
            position = db.query(PortfolioPosition).filter(
                PortfolioPosition.user_id == order.user_id,
                PortfolioPosition.asset_symbol == asset.symbol
            ).first()

            quantity = float(order.quantity)

            if order.order_type == OrderType.BUY:
                if position:
                    # Mettre à jour la position existante (moyenne pondérée)
                    current_value = float(position.current_quantity) * float(position.avg_purchase_price)
                    new_value = quantity * execution_price
                    new_total_quantity = float(position.current_quantity) + quantity
                    new_avg_price = (current_value + new_value) / new_total_quantity

                    position.current_quantity = Decimal(str(new_total_quantity))
                    position.avg_purchase_price = Decimal(str(new_avg_price))
                else:
                    # Créer une nouvelle position
                    position = PortfolioPosition(
                        user_id=order.user_id,
                        asset_symbol=asset.symbol,
                        current_quantity=order.quantity,
                        avg_purchase_price=Decimal(str(execution_price)),
                        created_at=datetime.utcnow()
                    )
                    db.add(position)

            elif order.order_type == OrderType.SELL:
                if position:
                    # Réduire la quantité
                    new_quantity = float(position.current_quantity) - quantity
                    if new_quantity <= 0:
                        # Supprimer la position si la quantité est nulle ou négative
                        db.delete(position)
                    else:
                        position.current_quantity = Decimal(str(new_quantity))
                else:
                    logger.warning(f"Tentative de vente sans position existante pour user {order.user_id}, asset {asset.symbol}")

        except Exception as e:
            logger.error(f"Erreur lors de la mise à jour du portfolio: {str(e)}")
            raise


# Tâche de surveillance en arrière-plan
async def monitoring_loop(execution_service: OrderExecutionService):
    """Boucle de surveillance continue des ordres"""
    logger.info("Démarrage de la boucle de surveillance des ordres")
    while MONITORING_ENABLED:
        try:
            results = await execution_service.check_and_execute_pending_orders()
            if results:
                logger.info(f"{len(results)} ordres exécutés lors de cette vérification")
        except Exception as e:
            logger.error(f"Erreur dans la boucle de surveillance: {str(e)}")

        await asyncio.sleep(MONITORING_INTERVAL)


# Gestion du cycle de vie de l'application
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gère le démarrage et l'arrêt de l'application"""
    # Démarrage
    logger.info("Démarrage du service d'exécution des ordres")
    task = asyncio.create_task(monitoring_loop(execution_service))

    yield

    # Arrêt
    logger.info("Arrêt du service d'exécution des ordres")
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


# Initialisation de l'application
app = FastAPI(
    title="Order Execution Service",
    description="Microservice de surveillance et d'exécution automatique des ordres d'investissement",
    version="1.0.0",
    lifespan=lifespan
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialisation des services
price_service = MarketPriceService(ALPHA_VANTAGE_API_KEY)
execution_service = OrderExecutionService(price_service)


# Endpoints REST
@app.get("/")
async def root():
    """Endpoint racine"""
    return {
        "service": "Order Execution Service",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Vérification de santé du service"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "database": "connected"
    }


@app.get("/monitoring/status", response_model=MonitoringStatus)
async def get_monitoring_status():
    """Obtenir le statut du service de surveillance"""
    db = SessionLocal()
    try:
        pending_count = db.query(InvestmentOrder).filter(
            InvestmentOrder.order_status == OrderStatus.PENDING
        ).count()

        return MonitoringStatus(
            enabled=MONITORING_ENABLED,
            interval_seconds=MONITORING_INTERVAL,
            pending_orders_count=pending_count,
            last_check=execution_service.last_check_time
        )
    finally:
        db.close()


@app.post("/monitoring/check-now")
async def trigger_manual_check(background_tasks: BackgroundTasks):
    """Déclencher manuellement une vérification des ordres"""
    results = await execution_service.check_and_execute_pending_orders()
    return {
        "message": "Vérification manuelle effectuée",
        "executed_orders": len(results),
        "results": results
    }


@app.get("/price/{symbol}", response_model=PriceInfo)
async def get_price(symbol: str):
    """Obtenir le prix actuel d'un symbole"""
    price = await price_service.get_current_price(symbol.upper())
    if price is None:
        raise HTTPException(status_code=404, detail=f"Prix non disponible pour {symbol}")

    return PriceInfo(
        symbol=symbol.upper(),
        price=price,
        timestamp=datetime.utcnow(),
        source="Alpha Vantage"
    )


@app.post("/orders/{order_id}/execute")
async def execute_order_manually(order_id: int):
    """Forcer l'exécution manuelle d'un ordre spécifique"""
    db = SessionLocal()
    try:
        order = db.query(InvestmentOrder).filter(
            InvestmentOrder.order_id == order_id
        ).first()

        if not order:
            raise HTTPException(status_code=404, detail="Ordre non trouvé")

        if order.order_status != OrderStatus.PENDING:
            raise HTTPException(
                status_code=400,
                detail=f"L'ordre est déjà dans l'état {order.order_status}"
            )

        asset = db.query(InvestmentAsset).filter(
            InvestmentAsset.asset_id == order.asset_id
        ).first()

        if not asset:
            raise HTTPException(status_code=404, detail="Asset non trouvé")

        current_price = await price_service.get_current_price(asset.symbol)
        if current_price is None:
            raise HTTPException(
                status_code=503,
                detail="Impossible de récupérer le prix du marché"
            )

        result = await execution_service._execute_order(db, order, asset, current_price)
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de l'exécution manuelle de l'ordre {order_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@app.get("/orders/pending")
async def get_pending_orders():
    """Obtenir la liste des ordres en attente"""
    db = SessionLocal()
    try:
        orders = db.query(InvestmentOrder).filter(
            InvestmentOrder.order_status == OrderStatus.PENDING
        ).all()

        return {
            "count": len(orders),
            "orders": [
                {
                    "order_id": order.order_id,
                    "user_id": order.user_id,
                    "asset_id": order.asset_id,
                    "order_type": order.order_type.value,
                    "quantity": float(order.quantity),
                    "target_price": float(order.price) if order.price else None,
                    "created_at": order.created_at
                }
                for order in orders
            ]
        }
    finally:
        db.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
