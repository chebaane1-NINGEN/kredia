export type UserRole = 'ADMIN' | 'CLIENT' | 'AGENT';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BLOCKED' | 'PENDING_VERIFICATION';
export type UserGender = 'MALE' | 'FEMALE' | 'OTHER';
export type ScoreImpact = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
export type AlertSeverity = 'INFO' | 'WARNING' | 'DANGER';

export interface User {
  userId?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  phoneNumber?: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
  dateOfBirth?: string;
  address?: string;
  gender?: UserGender;
  emailVerified?: boolean;
  profilePictureUrl?: string;
  priorityScore?: number;
}

export interface ClientProfile extends User {
  phoneVerified?: boolean;
  lastLoginAt?: string;
  loginAttempts?: number;
  version?: number;
  accountAge?: number; // in days
  totalTransactions?: number;
}

// Enhanced Risk Score with full transparency
export interface ClientRiskScore {
  riskScore: number;
  baseScore: number;
  statusBonus: number;
  suspensionPenalty: number;
  activityBonus: number;
  seniorityBonus: number;
  breakdown: Record<string, number>;
  scoreHistory?: ScoreHistoryPoint[];
  scoreChange?: number; // Change from previous period
  scoreChangePercentage?: number;
  lastUpdated?: string;
  nextUpdateAt?: string;
}

// Risk Score history for trend visualization
export interface ScoreHistoryPoint {
  timestamp: string;
  score: number;
  baseScore: number;
  statusBonus: number;
  suspensionPenalty: number;
  activityBonus: number;
  seniorityBonus: number;
  reason?: string; // Why it changed (e.g., "Activity recorded", "Status changed")
}

// Risk factors breakdown
export interface RiskFactor {
  name: string;
  weight: number; // 0-100
  currentValue: number;
  impact: ScoreImpact;
  contribution: number; // points this factor contributes
  description: string;
}

// Business rules for eligibility
export interface BusinessRule {
  ruleId: string;
  ruleName: string;
  condition: string;
  status: 'MET' | 'NOT_MET' | 'CRITICAL';
  description: string;
  impact: string;
}

export interface ClientEligibility {
  eligible: boolean;
  reason: string;
  scoreThreshold: number;
  currentScore: number;
  isActive: boolean;
  statusReason: string;
  rules?: BusinessRule[];
  eligibilityBadge?: 'ELIGIBLE' | 'AT_RISK' | 'BLOCKED';
  scoreTillEligible?: number; // How many points needed to become eligible
}

// Enhanced Activity with impact tracking
export interface UserActivity {
  id?: number;
  userId: number;
  actionType: string;
  description: string;
  timestamp: string;
  previousValue?: string;
  newValue?: string;
  context?: string;
  scoreImpact?: number; // Points this activity affected score by
  impactType?: ScoreImpact;
  category?: string; // LOGIN, PROFILE_UPDATE, TRANSACTION, etc.
  severity?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ActivityPage {
  activities: UserActivity[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
}

// Smart alerts about score and eligibility
export interface SmartAlert {
  alertId: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  type: 'SCORE_CHANGE' | 'ELIGIBILITY_CHANGE' | 'STATUS_CHANGE' | 'ACTION_REQUIRED';
  timestamp: string;
  actionUrl?: string;
  dismissed?: boolean;
}

// AI Insights - explanations of user behavior
export interface AIInsight {
  insightId: string;
  category: string; // 'SCORE_DRIVER', 'BEHAVIOR', 'OPPORTUNITY', 'WARNING'
  title: string;
  message: string;
  confidence: number; // 0-100
  actionable: boolean;
  suggestedAction?: string;
}

// Financial metrics for dashboard KPIs
export interface FinancialMetrics {
  accountHealth: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  activityLevel: 'LOW' | 'MODERATE' | 'HIGH';
  accountAgeMonths: number;
  daysSinceLastActivity: number;
  totalActivityCount: number;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  gender?: UserGender;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
