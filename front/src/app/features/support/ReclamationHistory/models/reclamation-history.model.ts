export interface ReclamationHistory {
  historyId?: number;
  reclamationId: number;
  changedBy: string;
  previousStatus: string;
  newStatus: string;
  comment?: string;
  changedAt?: string;
}
