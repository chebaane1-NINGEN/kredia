export type ReclamationStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'WAITING_CUSTOMER'
  | 'ESCALATED'
  | 'REOPENED'
  | 'RESOLVED'
  | 'REJECTED';

export type ReclamationCategory =
  | 'PAYMENT'
  | 'CREDIT'
  | 'KYC'
  | 'FRAUD'
  | 'ACCOUNT'
  | 'TECHNICAL_SUPPORT'
  | 'OTHER';

export type ReclamationPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type ReclamationRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ReclamationMessageVisibility = 'CUSTOMER' | 'INTERNAL';

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

export interface RiskFeaturesDto {
  complaints_last_90d: number;
  message_len: number;
  wallet_balance: number;
  wallet_frozen_balance: number;
  credit_has_active: number;
  credit_installments_missed: number;
  credit_days_late: number;
}

export interface Reclamation {
  reclamationId?: number;
  userId: number;
  assignedTo?: number | null;
  subject: string;
  description: string;
  category: ReclamationCategory;
  status: ReclamationStatus;
  priority: ReclamationPriority;
  duplicateCount: number;
  riskScore?: number | null;
  riskLevel: ReclamationRiskLevel;
  createdAt?: string;
  lastActivityAt?: string;
  firstResponseAt?: string | null;
  firstResponseDueAt?: string | null;
  resolutionDueAt?: string | null;
  resolvedAt?: string;
  customerSatisfactionScore?: number | null;
  customerFeedback?: string | null;
  slaBreached: boolean;
  modelInput?: RiskFeaturesDto | null;
}

export interface ReclamationCreateRequest {
  userId: number;
  subject: string;
  description: string;
  priority?: ReclamationPriority;
  category?: ReclamationCategory;
}

export interface ReclamationUpdateRequest {
  subject: string;
  description: string;
  priority: ReclamationPriority;
  category: ReclamationCategory;
}

export interface ReclamationStatusUpdateRequest {
  actorUserId: number;
  newStatus: ReclamationStatus;
  note?: string;
}

export interface ReclamationAssignRequest {
  actorUserId: number;
  agentUserId: number;
  note?: string;
}

export interface ReclamationFeedbackRequest {
  actorUserId: number;
  customerSatisfactionScore: number;
  customerFeedback?: string;
}

export interface ReclamationMessageCreateRequest {
  authorUserId: number;
  visibility: ReclamationMessageVisibility;
  message: string;
}

export interface ReclamationMessage {
  messageId?: number;
  authorUserId: number;
  visibility: ReclamationMessageVisibility;
  message: string;
  createdAt?: string;
}

export interface ReclamationHistory {
  historyId?: number;
  actorUserId?: number | null;
  oldStatus: ReclamationStatus;
  newStatus: ReclamationStatus;
  changedAt?: string;
  note?: string | null;
}

export interface ReclamationAttachment {
  attachmentId?: number;
  fileName: string;
  fileUrl: string;
  contentType?: string | null;
  sizeBytes?: number | null;
  uploadedByUserId?: number | null;
  uploadedAt?: string;
}

export interface ReclamationCategoryStat {
  category: ReclamationCategory;
  count: number;
}

export interface ReclamationDashboard {
  totalReclamations: number;
  openReclamations: number;
  inProgressReclamations: number;
  waitingCustomerReclamations: number;
  escalatedReclamations: number;
  resolvedReclamations: number;
  rejectedReclamations: number;
  overdueFirstResponses: number;
  overdueResolutions: number;
  averageResolutionHours: number;
  averageCustomerSatisfaction: number;
  resolutionRate: number;
  categoryBreakdown: ReclamationCategoryStat[];
}

export interface RiskScoreResponse {
  reclamationId: number;
  riskScore: number;
  riskLevel?: ReclamationRiskLevel | null;
  features?: RiskFeaturesDto | null;
}
