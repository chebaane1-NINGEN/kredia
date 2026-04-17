export type EcheanceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIALLY_PAID';

export interface Echeance {
  echeanceId: number;
  echeanceNumber: number;
  capitalDebut: number;
  dueDate: string;
  amountDue: number;
  principalDue: number;
  interestDue: number;
  remainingBalance: number;
  amountPaid?: number;
  status: EcheanceStatus;
  paidAt?: string;
}

export interface EcheancePaymentResponse {
  echeance: Echeance;
  isPartialPayment: boolean;
  message: string;
  amountPaid: number;
  remainingAmount: number;
}

