/**
 * Realistic simulation data for the Kredia fintech dashboard.
 * Used as fallback / enrichment when backend returns empty or minimal data.
 */

export const MOCK_USERS = [
  { id: 101, firstName: 'Mohamed', lastName: 'Ali', email: 'mohamed.ali@kredia.com', role: 'CLIENT', status: 'ACTIVE', kycVerified: true, createdAt: '2025-01-15T09:00:00Z' },
  { id: 102, firstName: 'Sarah', lastName: 'Ben Salah', email: 'sarah.bensalah@gmail.com', role: 'CLIENT', status: 'ACTIVE', kycVerified: true, createdAt: '2025-02-03T14:20:00Z' },
  { id: 103, firstName: 'Karim', lastName: 'Mansouri', email: 'k.mansouri@outlook.com', role: 'CLIENT', status: 'SUSPENDED', kycVerified: false, createdAt: '2025-03-10T10:00:00Z' },
  { id: 104, firstName: 'Nour', lastName: 'El Amri', email: 'nour.elamri@yahoo.fr', role: 'CLIENT', status: 'ACTIVE', kycVerified: true, createdAt: '2025-03-22T08:00:00Z' },
  { id: 105, firstName: 'Amine', lastName: 'Trabelsi', email: 'amine.trabelsi@gmail.com', role: 'CLIENT', status: 'PENDING', kycVerified: false, createdAt: '2025-04-01T11:00:00Z' },
  { id: 106, firstName: 'Fatma', lastName: 'Zahra Chouikha', email: 'fatma.chouikha@kredia.com', role: 'EMPLOYEE', status: 'ACTIVE', kycVerified: true, createdAt: '2025-01-05T09:00:00Z' },
  { id: 107, firstName: 'Yassine', lastName: 'Boughanmi', email: 'yassine.b@kredia.com', role: 'EMPLOYEE', status: 'ACTIVE', kycVerified: true, createdAt: '2025-01-10T09:30:00Z' },
  { id: 108, firstName: 'Rim', lastName: 'Belhadj', email: 'rim.belhadj@kredia.com', role: 'ADMIN', status: 'ACTIVE', kycVerified: true, createdAt: '2024-12-01T09:00:00Z' },
];

export const MOCK_ACTIVITIES = [
  { activityId: 1001, userId: 101, actorId: null, activityType: 'USER_LOGIN', description: 'Mohamed Ali logged in from 192.168.1.10', timestamp: new Date(Date.now() - 7200000).toISOString(), isSuspicious: false },
  { activityId: 1002, userId: 102, actorId: null, activityType: 'KYC_SUBMITTED', description: 'Sarah Ben Salah submitted KYC documents', timestamp: new Date(Date.now() - 14400000).toISOString(), isSuspicious: false },
  { activityId: 1003, userId: 103, actorId: 2, activityType: 'ACCOUNT_SUSPENDED', description: 'Account suspended by agent Fatma Zahra due to suspicious activity', timestamp: new Date(Date.now() - 86400000).toISOString(), isSuspicious: true },
  { activityId: 1004, userId: 104, actorId: null, activityType: 'LOAN_REQUEST', description: 'Nour El Amri requested a loan of 15,000 TND', timestamp: new Date(Date.now() - 172800000).toISOString(), isSuspicious: false },
  { activityId: 1005, userId: 105, actorId: null, activityType: 'PROFILE_UPDATE', description: 'Amine Trabelsi updated phone number', timestamp: new Date(Date.now() - 3600000).toISOString(), isSuspicious: false },
  { activityId: 1006, userId: 101, actorId: null, activityType: 'KYC_VALIDATED', description: 'KYC validation completed — HIGH eligibility granted', timestamp: new Date(Date.now() - 259200000).toISOString(), isSuspicious: false },
  { activityId: 1007, userId: 102, actorId: 2, activityType: 'INVESTMENT_ADVICE', description: 'Agent recommended Portfolio B for Sarah — 8% annual return', timestamp: new Date(Date.now() - 432000000).toISOString(), isSuspicious: false },
];

export const MOCK_AGENT_PERFORMANCE = {
  agentId: 2,
  agentName: 'Fatma Zahra Chouikha',
  totalClientsManaged: 47,
  totalLoansProcessed: 128,
  totalInvestmentsAdvised: 34,
  averageResponseTimeHrs: 2.4,
  clientSatisfactionScore: 4.6,
  performanceRating: 'EXCELLENT',
  approvalRate: 72,
  rejectionRate: 28,
};

export const MOCK_CLIENT_RISK = {
  clientId: 3,
  reliabilityScore: 78,
  eligibilityLevel: 'HIGH' as const ,
  estimatedLoanCapacity: 25000,
  monthlyIncome: 3200,
  existingDebt: 1800,
  creditHistoryMonths: 36,
};

// Relative timestamp helper (e.g. "2 hours ago")
export function relativeTime(isoDate: string): string {
  const ms = Date.now() - new Date(isoDate).getTime();
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Activity type to icon mapping
export const ACTIVITY_ICONS: Record<string, string> = {
  USER_LOGIN: '🔐',
  KYC_SUBMITTED: '📋',
  KYC_VALIDATED: '✅',
  KYC_REJECTED: '❌',
  ACCOUNT_SUSPENDED: '⛔',
  ACCOUNT_ACTIVATED: '🟢',
  LOAN_REQUEST: '💳',
  INVESTMENT_ADVICE: '📈',
  PROFILE_UPDATE: '✏️',
  PASSWORD_RESET: '🔑',
  ROLE_CHANGED: '🔄',
  DEFAULT: '📝',
};

export function getActivityIcon(type: string): string {
  return ACTIVITY_ICONS[type] || ACTIVITY_ICONS.DEFAULT;
}

// Color mapping for eligibility
export const ELIGIBILITY_CONFIG = {
  HIGH: { color: '#05CD99', bg: '#E6FAF5', label: 'High Eligibility', score: '🟢' },
  MEDIUM: { color: '#FFCE20', bg: '#FFF9E5', label: 'Medium Eligibility', score: '🟡' },
  LOW: { color: '#EE5D50', bg: '#FDEDEC', label: 'Low Eligibility', score: '🔴' },
} as const;
