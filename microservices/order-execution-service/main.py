import asyncio
import httpx
import logging
from datetime import datetime
from decimal import Decimal
from enum import Enum
import os
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Numeric, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root@localhost:3306/kredia_db")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class OrderType(str, Enum):
    BUY = "BUY"
    SELL = "SELL"


class OrderStatus(str, Enum):
    PENDING = "PENDING"
    EXECUTED = "EXECUTED"


class InvestmentOrder(Base):
    __tablename__ = "investment_orders"
    order_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    asset_symbol = Column(String(20), nullable=False)
    order_type = Column(SQLEnum(OrderType), nullable=False)
    quantity = Column(Numeric(15, 8), nullable=False)
    price = Column(Numeric(15, 2))
    order_status = Column(SQLEnum(OrderStatus), nullable=False, default=OrderStatus.PENDING)
    executed_at = Column(DateTime)


class PortfolioPosition(Base):
    __tablename__ = "portfolio_positions"
    position_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    asset_symbol = Column(String(20), nullable=False)
    current_quantity = Column(Numeric(15, 8), nullable=False)
    avg_purchase_price = Column(Numeric(15, 2), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


async def get_price(symbol: str) -> float:
    """Récupère le prix actuel d'un symbole via Yahoo Finance"""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
            params = {"interval": "1d", "range": "1d"}
            response = await client.get(url, params=params)
            
            if response.status_code == 429:
                logger.warning(f"Rate limit atteint pour {symbol}, attente 2s")
                await asyncio.sleep(2)
                return None
            
            data = response.json()
            
            if "chart" in data and "result" in data["chart"]:
                result = data["chart"]["result"]
                if result and len(result) > 0:
                    meta = result[0].get("meta", {})
                    price = meta.get("regularMarketPrice")
                    if price and price > 0:
                        logger.info(f"Prix {symbol}: {price}")
                        return float(price)
        logger.error(f"Erreur prix {symbol}: prix non valide ou non trouvé")
        return None
    except Exception as e:
        logger.error(f"Erreur prix {symbol}: {e}")
        return None


async def check_orders():
    """Vérifie les ordres en attente et exécute si le prix est atteint"""
    db = SessionLocal()
    try:
        orders = db.query(InvestmentOrder).filter(
            InvestmentOrder.order_status == OrderStatus.PENDING,
            InvestmentOrder.price.isnot(None)
        ).all()
        
        logger.info(f"Vérification de {len(orders)} ordres")
        
        for order in orders:
            current_price = await get_price(order.asset_symbol)
            if current_price is None:
                continue
            
            target_price = float(order.price)
            execute = False
            logger.info(f"Ordre {order.order_id}: {order.order_type.value} {order.asset_symbol} @ {target_price} (prix actuel: {current_price})")
            if order.order_type == OrderType.BUY and current_price <= target_price:
                execute = True
            elif order.order_type == OrderType.SELL and current_price >= target_price:
                execute = True
            
            if execute:
                # Mise à jour de l'ordre
                order.order_status = OrderStatus.EXECUTED
                order.executed_at = datetime.utcnow()
                order.price = Decimal(str(current_price))
                
                # Mise à jour du portfolio
                position = db.query(PortfolioPosition).filter(
                    PortfolioPosition.user_id == order.user_id,
                    PortfolioPosition.asset_symbol == order.asset_symbol
                ).first()
                
                quantity = float(order.quantity)
                
                if order.order_type == OrderType.BUY:
                    if position:
                        current_value = float(position.current_quantity) * float(position.avg_purchase_price)
                        new_value = quantity * current_price
                        new_total = float(position.current_quantity) + quantity
                        new_avg = (current_value + new_value) / new_total
                        position.current_quantity = Decimal(str(new_total))
                        position.avg_purchase_price = Decimal(str(new_avg))
                    else:
                        position = PortfolioPosition(
                            user_id=order.user_id,
                            asset_symbol=order.asset_symbol,
                            current_quantity=order.quantity,
                            avg_purchase_price=Decimal(str(current_price)),
                            created_at=datetime.utcnow()
                        )
                        db.add(position)
                
                elif order.order_type == OrderType.SELL and position:
                    new_qty = float(position.current_quantity) - quantity
                    if new_qty <= 0:
                        db.delete(position)
                    else:
                        position.current_quantity = Decimal(str(new_qty))
                
                db.commit()
                logger.info(f"✓ Ordre {order.order_id} exécuté: {order.order_type.value} {order.asset_symbol} @ {current_price}")
                
                # Envoyer la notification par email
                await send_email_notification(order, current_price)
    
    except Exception as e:
        logger.error(f"Erreur: {e}")
        db.rollback()
    finally:
        db.close()


async def send_email_notification(order: InvestmentOrder, executed_price: float):
    """Envoie une notification email via l'API Spring Boot"""
    try:
        api_url = os.getenv("SPRING_API_URL", "http://localhost:8081")
        notification_data = {
            "orderId": order.order_id,
            "userId": order.user_id,
            "assetSymbol": order.asset_symbol,
            "orderType": order.order_type.value,
            "quantity": str(order.quantity),
            "executedPrice": str(executed_price),
            "executedAt": order.executed_at.isoformat() if order.executed_at else None
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{api_url}/api/order-execution/notify",
                json=notification_data
            )
            if response.status_code == 200:
                logger.info(f"✉️  Email notification envoyée pour l'ordre {order.order_id}")
            else:
                logger.warning(f"⚠️  Erreur envoi email (status {response.status_code}): {response.text}")
    except Exception as e:
        logger.error(f"❌ Erreur lors de l'envoi de la notification email: {e}")


async def main():
    """Boucle principale qui vérifie toutes les 30 secondes"""
    logger.info("Démarrage de la surveillance des ordres (vérification toutes les 30 secondes)")
    
    while True:
        await check_orders()
        await asyncio.sleep(30)


if __name__ == "__main__":
    asyncio.run(main())
