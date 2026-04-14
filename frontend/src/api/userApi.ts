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
  UserStatus,
  AuthResponseDTO
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
    const token = localStorage.getItem('kredia_token');
    
    if (actorId && config.headers) {
      config.headers['X-Actor-Id'] = actorId;
    }
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
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
    
    // Handle timeout and network errors
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
      const msg = 'Backend not reachable. Please ensure the server is running on port 8086.';
      console.warn('[QA-ROBUSTNESS] Network error detected:', msg);
      return Promise.reject(new Error(msg));
    }
    
    if (error.response?.status === 404) {
      return Promise.reject(new Error('Resource not found (404).'));
    }
    
    if (error.response?.status >= 500) {
      return Promise.reject(new Error('Server error. Please try again later.'));
    }
    
    // Handle business errors (400, etc.)
    if (error.response?.data?.message) {
      return Promise.reject(new Error(error.response.data.message));
    }
    
    return Promise.reject(error);
  }
);

// Helper to extract data from the wrapper
const extractData = <T>(response: { data: ApiResponse<T> }): T => response.data.data;

export const userApi = {
  // ---- Auth Endpoints ----
  login: (email: string, password: string) => 
    axios.post<ApiResponse<AuthResponseDTO>>('http://localhost:8086/api/auth/login', { email, password }).then(res => res.data.data),
    
  register: (user: any) =>
    axios.post<ApiResponse<UserResponseDTO>>('http://localhost:8086/api/auth/register', user).then(res => res.data.data),

  googleLogin: (idToken: string) =>
    axios.post<ApiResponse<AuthResponseDTO>>('http://localhost:8086/api/auth/google', { idToken }).then(res => res.data.data),

  verifyEmail: (token: string) =>
    axios.post<ApiResponse<void>>('http://localhost:8086/api/auth/verify-email', null, { params: { token } }).then(res => res.data.data),

  forgotPassword: (email: string) =>
    axios.post<ApiResponse<void>>('http://localhost:8086/api/auth/forgot-password', { email }).then(res => res.data.data),

  resetPassword: (token: string, password: string) =>
    axios.post<ApiResponse<void>>('http://localhost:8086/api/auth/reset-password', { token, password }).then(res => res.data.data),
    
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
  
  getById: (id: number, actorIdOverride?: number) => api.get<ApiResponse<UserResponseDTO>>(`/${id}`, {
    headers: actorIdOverride ? { 'X-Actor-Id': String(actorIdOverride) } : undefined
  }).then(extractData),
  
  update: (id: number, user: Partial<UserRequestDTO>) => api.put<ApiResponse<UserResponseDTO>>(`/${id}/admin`, user).then(extractData),
  updateProfile: (id: number, user: any) => api.put<ApiResponse<UserResponseDTO>>(`/${id}/profile`, user).then(extractData),
  
  delete: (id: number) => api.delete<ApiResponse<void>>(`/${id}`).then(extractData),

  // ---- Status Management ----
  restore: (id: number) => api.patch<ApiResponse<UserResponseDTO>>(`/${id}/restore`).then(extractData),
  block: (id: number) => api.patch<ApiResponse<UserResponseDTO>>(`/${id}/block`).then(extractData),
  suspend: (id: number) => api.patch<ApiResponse<UserResponseDTO>>(`/${id}/suspend`).then(extractData),
  activate: (id: number) => api.patch<ApiResponse<UserResponseDTO>>(`/${id}/activate`).then(extractData),
  deactivate: (id: number) => api.patch<ApiResponse<UserResponseDTO>>(`/${id}/deactivate`).then(extractData),
  changeRole: (id: number, role: UserRole) => api.patch<ApiResponse<UserResponseDTO>>(`/${id}/role`, { role }).then(extractData),

  // ---- Bulk Actions ----
  bulkDelete: (ids: number[]) => api.delete<ApiResponse<void>>('/admin/bulk-delete', { data: ids }).then(extractData),
  bulkUpdateStatus: (ids: number[], status: UserStatus) => 
    api.patch<ApiResponse<void>>('/admin/bulk-status', ids, { params: { status } }).then(extractData),

  // ---- Admin Endpoints ----
  getAdminStats: () => api.get<ApiResponse<AdminStatsDTO>>('/admin/stats').then(extractData),
  getAdminAgents: (p?: { page?: number; size?: number }) => api.get<ApiResponse<Page<UserResponseDTO>>>('/admin/agents', { params: p }).then(extractData),
  getAdminClients: (p?: { page?: number; size?: number }) => api.get<ApiResponse<Page<UserResponseDTO>>>('/admin/clients', { params: p }).then(extractData),
  getAdminAudit: (userId: number, p?: { page?: number; size?: number }) => api.get<ApiResponse<Page<UserActivityResponseDTO>>>(`/admin/audit/${userId}`, { params: p }).then(extractData),
  getAdminActivitiesByRole: (role?: UserRole, p?: { page?: number; size?: number }) => 
    api.get<ApiResponse<Page<UserActivityResponseDTO>>>('/admin/activities', { params: { role, ...p } }).then(extractData),

  // ---- Employee Endpoints ----
  getAgentDashboard: (agentId: number) => api.get<ApiResponse<AgentPerformanceDTO>>(`/agent/${agentId}/dashboard`).then(extractData),
  getAgentPerformance: (agentId: number) => api.get<ApiResponse<AgentPerformanceDTO>>(`/agent/${agentId}/performance`).then(extractData),
  getAgentActivities: (agentId: number, p?: { page?: number; size?: number }) => api.get<ApiResponse<Page<UserActivityResponseDTO>>>(`/agent/${agentId}/activity`, { params: p }).then(extractData),

  // ---- Client Endpoints ----
  getClientProfile: (clientId: number) => api.get<ApiResponse<UserResponseDTO>>(`/client/${clientId}/profile`).then(extractData),
  getClientActivities: (clientId: number, p?: { page?: number; size?: number }) => api.get<ApiResponse<Page<UserActivityResponseDTO>>>(`/client/${clientId}/activity`, { params: p }).then(extractData),
  getClientRiskScore: (clientId: number) => api.get<ApiResponse<ClientRiskScoreDTO>>(`/client/${clientId}/risk-score`).then(extractData),
  getClientEligibility: (clientId: number) => api.get<ApiResponse<ClientEligibilityDTO>>(`/client/${clientId}/eligibility`).then(extractData),
};
