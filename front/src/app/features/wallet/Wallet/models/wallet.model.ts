export type WalletStatus = 'ACTIVE' | 'FROZEN' | 'CLOSED';
export type WalletType = 'MAIN' | 'SAVINGS' | 'LOAN';

export interface Wallet {
  walletId?: number;
  userId: number;
  balance: number;
  currency: string;
  walletType: WalletType;
  status: WalletStatus;
  createdAt?: string;
}
