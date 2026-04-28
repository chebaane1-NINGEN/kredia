export interface AgentActivity {
  id: number;
  actionType: string;
  description: string;
  timestamp: string;
  userId?: number;
  userName?: string;
}

export interface AgentPerformance {
  approvalActionsCount: number;
  rejectionActionsCount: number;
  totalActions: number;
  performanceScore: number;
  numberOfClientsHandled: number;
  averageProcessingTimeSeconds: number;
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