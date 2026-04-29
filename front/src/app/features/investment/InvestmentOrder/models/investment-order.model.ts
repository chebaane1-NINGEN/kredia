export type OrderType = 'BUY' | 'SELL' | 'HOLD';
export type OrderStatus = 'PENDING' | 'EXECUTED' | 'CANCELLED' | 'PARTIALLY_FILLED';

export interface InvestmentOrderUser {
  userId?: number;
  id?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface InvestmentOrder {
  orderId: number;
  user?: InvestmentOrderUser;
  orderType: OrderType;
  quantity: number;
  price?: number | null;
  assetSymbol: string;
  orderStatus: OrderStatus;
  createdAt?: string;
  executedAt?: string | null;
}
