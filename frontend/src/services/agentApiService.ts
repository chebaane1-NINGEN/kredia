import { UserResponseDTO, UserStatus } from '../types/user.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8086/api';

export interface AgentPerformanceDTO {
  totalClients: number;
  activeClients: number;
  totalApprovals: number;
  totalRejections: number;
  performanceScore: number;
  averageProcessingTime: number;
  clientSatisfactionScore: number;
  last7DaysActivity: Array<{
    date: string;
    approvals: number;
    rejections: number;
    clientRegistrations: number;
  }>;
  monthlyPerformance: Array<{
    month: string;
    score: number;
    approvals: number;
    rejections: number;
  }>;
  actionBreakdown?: Array<{ action: string; count: number; percentage: number }>;
}

export interface AgentActivityDTO {
  id: number;
  actionType: string;
  description: string;
  timestamp: string;
  userId: number;
  targetUserId?: number;
  userEmail: string;
  userName: string;
  clientName?: string;
  ipAddress?: string;
}

export interface AgentClientsResponse {
  content: UserResponseDTO[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

// Agent API Service
class AgentApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('kredia_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      'X-Actor-Id': localStorage.getItem('kredia_actor_id') || ''
    };
  }

  // Get current agent's clients
  async getAgentClients(page = 0, size = 10, status?: UserStatus, search?: string): Promise<AgentClientsResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString()
      });

      if (status) {
        params.append('status', status.toString());
      }
      if (search) {
        params.append('email', search);
      }

      const response = await fetch(`${API_BASE_URL}/user/agent/clients?${params}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      return json.data;
    } catch (error) {
      console.error('Error fetching agent clients:', error);
      throw error;
    }
  }

  // Create new client
  async createClient(clientData: any): Promise<UserResponseDTO> {
    try {
      const response = await fetch(`${API_BASE_URL}/user`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          ...clientData,
          role: 'CLIENT'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }

  // Update client
  async updateClient(clientId: number, clientData: any): Promise<UserResponseDTO> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/${clientId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(clientData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  }

  // Get client details
  async getClientDetails(clientId: number): Promise<UserResponseDTO> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/${clientId}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching client details:', error);
      throw error;
    }
  }

  // Get agent performance data
  async getAgentPerformance(): Promise<AgentPerformanceDTO> {
    try {
      const agentId = localStorage.getItem('kredia_user_id') || '1';
      const response = await fetch(`${API_BASE_URL}/user/agent/${agentId}/performance`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      const data = json.data;

      const approvals = data.approvalActionsCount ?? 0;
      const rejections = data.rejectionActionsCount ?? 0;
      const totalActions = data.totalActions ?? approvals + rejections;
      const avgProcessingTimeHours = Math.round(((data.averageProcessingTimeSeconds ?? 0) / 3600) * 10) / 10;
      const performanceScore = data.performanceScore ?? 0;

      return {
        totalClients: data.totalAssignedClients ?? 0,
        activeClients: data.activeAssignedClients ?? 0,
        totalApprovals: approvals,
        totalRejections: rejections,
        performanceScore,
        averageProcessingTime: avgProcessingTimeHours,
        clientSatisfactionScore: data.clientSatisfactionScore ?? 0,
        last7DaysActivity: [],
        monthlyPerformance: [
          {
            month: 'Current',
            score: performanceScore,
            approvals,
            rejections
          }
        ],
        actionBreakdown: [
          {
            action: 'Approvals',
            count: approvals,
            percentage: totalActions > 0 ? Math.round((approvals * 100) / totalActions) : 0
          },
          {
            action: 'Rejections',
            count: rejections,
            percentage: totalActions > 0 ? Math.round((rejections * 100) / totalActions) : 0
          }
        ]
      };
    } catch (error) {
      console.error('Error fetching agent performance:', error);
      throw error;
    }
  }

  // Get agent activities (audit log)
  async getAgentActivities(page = 0, size = 10, actionType?: string, search?: string): Promise<{ content: AgentActivityDTO[], totalPages: number, totalElements: number }> {
    try {
      const agentId = localStorage.getItem('kredia_user_id') || '1';
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString()
      });

      if (actionType) {
        params.append('actionType', actionType);
      }
      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`${API_BASE_URL}/user/agent/${agentId}/activity?${params}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      const data = json.data;
      return {
        content: data.content.map((activity: any) => ({
          id: activity.id,
          actionType: activity.actionType,
          description: activity.description,
          timestamp: activity.timestamp,
          userId: activity.userId,
          userEmail: activity.userEmail || '',
          userName: activity.userName || `User ${activity.userId}`,
          clientName: activity.targetUserName || (activity.targetUserId ? `Client ${activity.targetUserId}` : ''),
          ipAddress: activity.ipAddress || 'N/A'
        })),
        totalPages: data.totalPages,
        totalElements: data.totalElements
      };
    } catch (error) {
      console.error('Error fetching agent activities:', error);
      throw error;
    }
  }

  // Send message to admin or another agent
  async sendMessage(receiverId: number, content: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/messages`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: new URLSearchParams({
          receiverId: receiverId.toString(),
          content: content
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      return json.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Get conversation with specific user
  async getConversation(otherUserId: number, page = 0, size = 50): Promise<{ content: any[], totalPages: number, totalElements: number }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString()
      });

      const response = await fetch(`${API_BASE_URL}/messages/conversation/${otherUserId}?${params}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      const data = json.data;
      return {
        content: data.content || [],
        totalPages: data.totalPages || 1,
        totalElements: data.totalElements || 0
      };
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  }

  // Get all users for messaging (admins and agents)
  async getMessageUsers(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/user?role=ADMIN&role=AGENT&size=100`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      return json.data.content || [];
    } catch (error) {
      console.error('Error fetching message users:', error);
      throw error;
    }
  }

  // Mock data for development
}

export const agentApiService = new AgentApiService();
