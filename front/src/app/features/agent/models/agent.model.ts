export interface AgentActivity {
  id: number;
  actionType: string;
  description: string;
  timestamp: string;
  userId?: number;
  userName?: string;
  clientId?: number;
  clientName?: string;
  previousValue?: string;
  newValue?: string;
  context?: string;
}

export interface PerformanceTrendPoint {
  date: string;
  score: number;
  actions: number;
  approvals: number;
}

export interface ApprovalTrendPoint {
  date: string;
  approvals: number;
  rejections: number;
}

export interface AgentPerformance {
  performanceScore: number;
  totalActions: number;
  approvals: number;
  rejections: number;
  approvalRate: number;
  clientsHandled: number;
  avgProcessingTime: number;
  pendingClients?: number;
  efficiencyScore?: number;
  weeklyTrend?: PerformanceTrendPoint[];
  monthlyTrend?: PerformanceTrendPoint[];
  approvalTrend?: ApprovalTrendPoint[];
  insights?: string[];
  performanceStatus?: string;
  performanceColor?: string;
  scoreChangeFromLastWeek?: number;
  approvalRateChangeFromLastWeek?: number;
  processingTimeChangeFromLastWeek?: number;
  calculationWindow?: string;
  scoreFormula?: string;
  approvalRateFormula?: string;
  efficiencyFormula?: string;
  dataSources?: string[];
  recommendations?: string[];
}

export interface AgentDashboard extends AgentPerformance {
  totalClients?: number;
  activeClients?: number;
  recentActivities: AgentActivity[];
}

export interface AgentClient {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  status: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  assignedAgentId?: number;
  assignedAgentName?: string;
  dateOfBirth: string;
  address: string;
  gender: string;
  lastInteraction?: string;
  priorityScore?: number;
}

export interface ClientDetails extends AgentClient {
  activities: AgentActivity[];
  riskScore?: number;
  eligibility?: string;
}

export interface AgentProfile {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: string;
  createdAt: string;
  lastLogin?: string;
  profilePicture?: string;
  department?: string;
  manager?: string;
}
