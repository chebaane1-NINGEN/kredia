export type DocType = 'ID_CARD' | 'PASSPORT' | 'PROOF_OF_ADDRESS' | 'SELFIE' | 'OTHER';
export type DocStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface KycDocument {
  docId?: number;
  userId: number;
  docType: DocType;
  filePath?: string;
  status: DocStatus;
  submittedAt?: string;
  reviewedAt?: string;
}
