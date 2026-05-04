export type LoanTransactionType = 'DISBURSEMENT' | 'REPAYMENT' | 'PENALTY' | 'INTEREST';

export interface TransactionLoan {
  loanTransactionId?: number;
  creditId: number;
  walletId: number;
  amount: number;
  type: LoanTransactionType;
  description?: string;
  createdAt?: string;
}
