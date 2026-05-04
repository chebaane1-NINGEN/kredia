export type DocumentTypeLoan =
  | 'INCOME_PROOF'
  | 'SPOUSE_INCOME'
  | 'ID_PROOF'
  | 'BANK_STATEMENT'
  | 'OTHER';

export type VerifiedStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface KycLoanResponse {
  kycLoanId: number;
  creditId: number;
  userId: number;
  documentType: DocumentTypeLoan;
  documentPath: string;
  submittedAt: string;
  verifiedStatus: VerifiedStatus;
  verificationMessage?: string;
}

export interface KycLoan {
  creditId: number;
  userId: number;
  documentType: DocumentTypeLoan;
  file: File;
}
