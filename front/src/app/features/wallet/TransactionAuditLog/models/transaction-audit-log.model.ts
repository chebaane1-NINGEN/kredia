export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'FREEZE' | 'UNFREEZE';

export interface TransactionAuditLog {
  auditId?: number;
  transactionId: number;
  action: AuditAction;
  performedBy: string;
  details?: string;
  timestamp?: string;
}
