export type ReclamationStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type ReclamationCategory = 'PAYMENT' | 'ACCOUNT' | 'LOAN' | 'CARD' | 'OTHER';

export interface Reclamation {
  reclamationId?: number;
  userId: number;
  subject: string;
  description: string;
  category: ReclamationCategory;
  status: ReclamationStatus;
  createdAt?: string;
  resolvedAt?: string;
}
