import axios from 'axios';
import {
  ApiResponse,
  Page,
  UserResponseDTO,
  UserRequestDTO,
  AdminStatsDTO,
  UserActivityResponseDTO,
  AgentPerformanceDTO,
  ClientRiskScoreDTO,
  ClientEligibilityDTO,
  UserRole,
  UserStatus
} from '../types/user.types';

const api = axios.create({
  baseURL: 'http://localhost:8086/api/user',
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add auth header
api.interceptors.request.use(
  (config) => {
    const actorId = localStorage.getItem('kredia_actor_id');
    if (actorId && config.headers) {
      config.headers['X-Actor-Id'] = actorId;
    }
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API] Response error:', error.message);
    
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
      return Promise.reject(new Error('Backend not reachable. Please ensure the server is running on port 8086.'));
    }
    
    if (error.response?.status === 404) {
      return Promise.reject(new Error('User not found.'));
    }
    
    if (error.response?.status >= 500) {
      return Promise.reject(new Error('Server error. Please try again later.'));
    }
    
    return Promise.reject(error);
  }
);

// Helper to extract data from the wrapper
const extractData = <T>(response: { data: ApiResponse<T> }): T => response.data.data;

export const userApi = {
  // ---- CRUD ----
  create: (user: UserRequestDTO) => api.post<ApiResponse<UserResponseDTO>>('', user).then(extractData),
  
  search: (params?: { 
    email?: string; 
    status?: UserStatus; 
    role?: UserRole; 
    page?: number; 
    size?: number; 
    sort?: string 
  }) => api.get<ApiResponse<Page<UserResponseDTO>>>('', { params }).then(extractData),
  
  getById: (id: number) => api.get<ApiResponse<UserResponseDTO>>(`/${id}`).then(extractData),
  
  update: (id: number, user: Partial<UserRequestDTO>) => api.put<ApiResponse<UserResponseDTO>>(`/${id}`, user).then(extractData),
  
  delete: (id: number) => api.delete<ApiResponse<void>>(`/${id}`).then(extractData),

  // ---- Status Management ----
  restore: (id: number) => api.patch<ApiResponse<UserResponseDTO>>(`/${id}/restore`).then(extractData),
  block: (id: number) => api.patch<ApiResponse<UserResponseDTO>>(`/${id}/block`).then(extractData),
  suspend: (id: number) => api.patch<ApiResponse<UserResponseDTO>>(`/${id}/suspend`).then(extractData),
  activate: (id: number) => api.patch<ApiResponse<UserResponseDTO>>(`/${id}/activate`).then(extractData),
  deactivate: (id: number) => api.patch<ApiResponse<UserResponseDTO>>(`/${id}/deactivate`).then(extractData),
  changeRole: (id: number, role: UserRole) => api.patch<ApiResponse<UserResponseDTO>>(`/${id}/role`, { role }).then(extractData),

  // ---- Admin Endpoints ----
  getAdminStats: () => api.get<ApiResponse<AdminStatsDTO>>('/admin/stats').then(extractData),
  getAdminAgents: (p?: { page?: number; size?: number }) => api.get<ApiResponse<Page<UserResponseDTO>>>('/admin/agents', { params: p }).then(extractData),
  getAdminClients: (p?: { page?: number; size?: number }) => api.get<ApiResponse<Page<UserResponseDTO>>>('/admin/clients', { params: p }).then(extractData),
  getAdminAudit: (userId: number) => api.get<ApiResponse<UserActivityResponseDTO[]>>(`/admin/audit/${userId}`).then(extractData),
  getAdminActivitiesByRole: (role: UserRole, p?: { page?: number; size?: number }) => 
    api.get<ApiResponse<UserActivityResponseDTO[]>>('/admin/activities', { params: { role, ...p } }).then(extractData),

  // ---- Employee Endpoints ----
  getAgentDashboard: (agentId: number) => api.get<ApiResponse<AgentPerformanceDTO>>(`/agent/${agentId}/dashboard`).then(extractData),
  getAgentPerformance: (agentId: number) => api.get<ApiResponse<AgentPerformanceDTO>>(`/agent/${agentId}/performance`).then(extractData),
  getAgentActivities: (agentId: number) => api.get<ApiResponse<UserActivityResponseDTO[]>>(`/agent/${agentId}/activities`).then(extractData),

  // ---- Client Endpoints ----
  getClientProfile: (clientId: number) => api.get<ApiResponse<UserResponseDTO>>(`/client/${clientId}/profile`).then(extractData),
  getClientActivities: (clientId: number) => api.get<ApiResponse<UserActivityResponseDTO[]>>(`/client/${clientId}/activities`).then(extractData),
  getClientRiskScore: (clientId: number) => api.get<ApiResponse<ClientRiskScoreDTO>>(`/client/${clientId}/risk-score`).then(extractData),
  getClientEligibility: (clientId: number) => api.get<ApiResponse<ClientEligibilityDTO>>(`/client/${clientId}/eligibility`).then(extractData),
};
