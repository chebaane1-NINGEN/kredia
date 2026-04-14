import { UserResponseDTO, UserStatus } from '../types/user.types';

const API_BASE_URL = 'http://localhost:8086/api';

export interface AgentPerformanceDTO {
  totalClients: number;
  activeClients: number;
  totalApprovals: number;
  totalRejections: number;
  performanceScore: number;
  averageProcessingTime: number;
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

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching agent clients:', error);
      // Fallback to mock data for development
      return this.getMockClients();
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

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching agent performance:', error);
      // Fallback to mock data
      return this.getMockPerformance();
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

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching agent activities:', error);
      // Fallback to mock data
      return this.getMockActivities();
    }
  }

  // Mock data for development
  private getMockClients(): AgentClientsResponse {
    const mockClients: UserResponseDTO[] = [
      {
        id: 1,
        firstName: 'Mohamed',
        lastName: 'Ben Ali',
        email: 'mohamed.benali@client.com',
        phoneNumber: '+21620000001',
        role: 'CLIENT' as any,
        status: UserStatus.ACTIVE,
        createdAt: '2024-03-15T10:30:00Z',
        updatedAt: '2024-04-01T14:20:00Z',
        isDeleted: false,
        isActive: true,
        kycVerified: true
      },
      {
        id: 2,
        firstName: 'Fatima',
        lastName: 'Trabelsi',
        email: 'fatima.trabelsi@client.com',
        phoneNumber: '+21620000002',
        role: 'CLIENT' as any,
        status: UserStatus.ACTIVE,
        createdAt: '2024-03-18T09:15:00Z',
        updatedAt: '2024-04-02T11:45:00Z',
        isDeleted: false,
        isActive: true,
        kycVerified: true
      }
    ];

    return {
      content: mockClients,
      totalPages: 1,
      totalElements: mockClients.length,
      size: 10,
      number: 0
    };
  }

  private getMockPerformance(): AgentPerformanceDTO {
    return {
      totalClients: 15,
      activeClients: 12,
      totalApprovals: 45,
      totalRejections: 8,
      performanceScore: 85,
      averageProcessingTime: 24,
      last7DaysActivity: [
        { date: 'Mon', approvals: 8, rejections: 1, clientRegistrations: 2 },
        { date: 'Tue', approvals: 6, rejections: 2, clientRegistrations: 1 },
        { date: 'Wed', approvals: 9, rejections: 0, clientRegistrations: 3 },
        { date: 'Thu', approvals: 7, rejections: 1, clientRegistrations: 1 },
        { date: 'Fri', approvals: 10, rejections: 3, clientRegistrations: 2 },
        { date: 'Sat', approvals: 3, rejections: 1, clientRegistrations: 0 },
        { date: 'Sun', approvals: 2, rejections: 0, clientRegistrations: 1 }
      ],
      monthlyPerformance: [
        { month: 'Jan', score: 78, approvals: 35, rejections: 10 },
        { month: 'Feb', score: 82, approvals: 42, rejections: 9 },
        { month: 'Mar', score: 85, approvals: 45, rejections: 8 },
        { month: 'Apr', score: 88, approvals: 48, rejections: 6 }
      ]
    };
  }

  private getMockActivities(): { content: AgentActivityDTO[], totalPages: number, totalElements: number } {
    const mockActivities: AgentActivityDTO[] = [
      {
        id: 1,
        actionType: 'APPROVAL',
        description: 'Approved loan application for Mohamed Ben Ali',
        timestamp: '2024-04-07T09:30:00Z',
        userId: 1,
        userEmail: 'mohamed.benali@client.com',
        userName: 'Mohamed Ben Ali',
        clientName: 'Mohamed Ben Ali',
        ipAddress: '192.168.1.100'
      },
      {
        id: 2,
        actionType: 'REJECTION',
        description: 'Rejected loan application for Ahmed Gharbi',
        timestamp: '2024-04-07T10:15:00Z',
        userId: 3,
        userEmail: 'ahmed.gharbi@client.com',
        userName: 'Ahmed Gharbi',
        clientName: 'Ahmed Gharbi',
        ipAddress: '192.168.1.100'
      }
    ];

    return {
      content: mockActivities,
      totalPages: 1,
      totalElements: mockActivities.length
    };
  }
}

export const agentApiService = new AgentApiService();
