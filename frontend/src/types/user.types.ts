export enum UserRole {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
  AGENT = 'AGENT'
}

export enum UserStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
  SUSPENDED = 'SUSPENDED',
}

export interface UserResponseDTO {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  role: UserRole;
  status: UserStatus;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  kycVerified: boolean;
  lastLoginDate?: string;
}

export interface UserRequestDTO {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role?: UserRole;
  status?: UserStatus;
  isActive?: boolean;
}

export interface AdminStatsDTO {
  totalUser: number;
  totalClient: number;
  totalAgent: number;
  activeUser: number;
  blockedUser: number;
  suspendedUser: number;
  last24hRegistrations: number;
  roleDistribution: Record<UserRole, number>;
  systemHealthIndex: number;
  registrationEvolution: Record<string, number>;
  recentActivities: UserActivityResponseDTO[];
}

export interface UserActivityResponseDTO {
  activityId: number;
  userId: number;
  actorId?: number;
  activityType: string;
  description: string;
  ipAddress?: string;
  timestamp: string;
  isSuspicious: boolean;
}

export interface AgentPerformanceDTO {
  agentId: number;
  totalClientsManaged: number;
  totalLoansProcessed: number;
  totalInvestmentsAdvised: number;
  averageResponseTimeHrs: number;
  clientSatisfactionScore: number;
  performanceRating: string;
}

export interface ClientRiskScoreDTO {
  clientId: number;
  riskScore: number;
  riskCategory: string;
  lastCalculated: string;
  factors: Record<string, number>;
}

export interface ClientEligibilityDTO {
  clientId: number;
  maxLoanAmount: number;
  maxInvestmentLimit: number;
  isEligibleForPremium: boolean;
  reasons: string[];
}

export interface Page<T> {
  content: T[];
  pageable: any;
  last: boolean;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  error?: string;
}
