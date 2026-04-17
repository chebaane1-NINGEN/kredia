export type TransactionType = 'CREDIT' | 'DEBIT' | 'TRANSFER' | 'LOAN_DISBURSEMENT' | 'LOAN_REPAYMENT';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';

export interface Transaction {
  transactionId?: number;
  walletId: number;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description?: string;
  createdAt?: string;
}
