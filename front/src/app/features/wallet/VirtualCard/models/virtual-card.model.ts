export type CardStatus = 'ACTIVE' | 'BLOCKED' | 'EXPIRED' | 'CANCELLED';

export interface VirtualCard {
  cardId?: number;
  walletId: number;
  userId: number;
  maskedNumber: string;
  expiryDate: string;
  status: CardStatus;
  createdAt?: string;
}
