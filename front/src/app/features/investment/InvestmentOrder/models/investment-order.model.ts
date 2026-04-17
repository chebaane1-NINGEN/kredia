export type OrderType = 'BUY' | 'SELL';
export type OrderStatus = 'PENDING' | 'EXECUTED' | 'CANCELLED' | 'FAILED';

export interface InvestmentOrder {
  orderId?: number;
  userId: number;
  assetId: number;
  orderType: OrderType;
  quantity: number;
  priceAtOrder: number;
  status: OrderStatus;
  createdAt?: string;
}
