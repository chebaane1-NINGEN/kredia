import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/http/api.config';
import { AuthService } from '../../../core/services/auth.service';
import { ApiResponse, PageResponse } from '../../admin/models/admin.model';
import {
  AgentDashboard,
  AgentClient,
  AgentPerformance,
  AgentActivity,
  ClientDetails,
  AgentProfile
} from '../models/agent.model';

@Injectable({ providedIn: 'root' })
export class AgentApi {
  private readonly auth = inject(AuthService);

  constructor(private readonly http: HttpClient) {}

  private getAgentId(): number {
    const agentId = this.auth.getCurrentUserId();
    if (agentId === null) {
      throw new Error('Unable to determine current agent ID from token');
    }
    return agentId;
  }

  // Dashboard
  getDashboard(): Observable<AgentDashboard> {
    const agentId = this.getAgentId();
    console.debug('[AgentApi] getDashboard', agentId);
    return this.http.get<ApiResponse<AgentDashboard>>(`${API_BASE_URL}/api/user/agent/${agentId}/dashboard`).pipe(
      map(response => response.data)
    );
  }

  // Clients
  getClients(
    email?: string,
    statuses?: string,
    page = 0,
    size = 1000,
    sortBy?: string,
    sortDirection?: string,
    startDate?: string,
    endDate?: string,
    priorities?: string
  ): Observable<PageResponse<AgentClient>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (email) params = params.set('email', email);
    if (statuses) params = params.set('statuses', statuses);
    if (sortBy) params = params.set('sortBy', sortBy);
    if (sortDirection) params = params.set('sortDirection', sortDirection);
    if (sortBy && sortDirection) params = params.set('sort', `${sortBy},${sortDirection}`);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (priorities) params = params.set('priorities', priorities);

    console.debug('[AgentApi] getClients', { email, statuses, page, size, startDate, endDate, priorities });
    return this.http.get<ApiResponse<PageResponse<AgentClient>>>(`${API_BASE_URL}/api/user/agent/clients/enhanced`, { params }).pipe(
      map(response => response.data)
    );
  }

  // Client Details
  getClientDetails(clientId: number): Observable<ClientDetails> {
    console.debug('[AgentApi] getClientDetails', clientId);
    return this.http.get<ApiResponse<ClientDetails>>(`${API_BASE_URL}/api/user/agent/client/${clientId}`).pipe(
      map(response => response.data)
    );
  }

  // Create client
  createClient(payload: Partial<AgentClient>): Observable<AgentClient> {
    console.debug('[AgentApi] createClient', payload);
    // Filter payload to only include fields expected by UserRequestDTO
    const createPayload = {
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phoneNumber: payload.phoneNumber,
      password: (payload as any).password || 'Client@123',
      role: 'CLIENT',
      status: payload.status || 'PENDING_VERIFICATION',
      dateOfBirth: payload.dateOfBirth,
      address: payload.address,
      gender: payload.gender
    };
    return this.http.post<ApiResponse<any>>(`${API_BASE_URL}/api/user`, createPayload).pipe(
      map(response => this.mapToAgentClient(response.data))
    );
  }

  // Performance
  getPerformance(): Observable<AgentPerformance> {
    const agentId = this.getAgentId();
    console.debug('[AgentApi] getPerformance', agentId);
    return this.http.get<ApiResponse<AgentPerformance>>(`${API_BASE_URL}/api/agent/performance/${agentId}`).pipe(
      map(response => response.data)
    );
  }

  // Activity/Audit
  getActivity(page = 0, size = 20, filters?: {
    actionType?: string;
    clientId?: number;
    fromDate?: string;
    toDate?: string;
    search?: string;
  }): Observable<PageResponse<AgentActivity>> {
    const agentId = this.getAgentId();
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'timestamp,desc');
    if (filters?.actionType) params = params.set('actionType', filters.actionType);
    if (filters?.clientId) params = params.set('clientId', filters.clientId.toString());
    if (filters?.fromDate) params = params.set('fromDate', filters.fromDate);
    if (filters?.toDate) params = params.set('toDate', filters.toDate);
    if (filters?.search) params = params.set('search', filters.search);

    console.debug('[AgentApi] getActivity', { agentId, page, size });
    return this.http.get<ApiResponse<PageResponse<AgentActivity>>>(`${API_BASE_URL}/api/user/agent/${agentId}/activity`, { params }).pipe(
      map(response => response.data)
    );
  }

  // Update client
  updateClient(clientId: number, updates: Partial<AgentClient>): Observable<AgentClient> {
    return this.http.put<ApiResponse<any>>(`${API_BASE_URL}/api/user/${clientId}`, updates).pipe(
      map(response => this.mapToAgentClient(response.data))
    );
  }

  private mapToAgentClient(data: any): AgentClient {
    return {
      userId: data.userId ?? data.id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      status: data.status,
      role: data.role,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      assignedAgentId: data.assignedAgentId,
      assignedAgentName: data.assignedAgentName,
      dateOfBirth: data.dateOfBirth,
      address: data.address,
      gender: data.gender,
      lastInteraction: data.lastInteraction,
      priorityScore: data.priorityScore
    } as AgentClient;
  }

  // Profile
  getProfile(): Observable<AgentProfile> {
    const agentId = this.getAgentId();
    console.debug('[AgentApi] getProfile', agentId);
    return this.http.get<ApiResponse<AgentProfile>>(`${API_BASE_URL}/api/user/${agentId}`).pipe(
      map(response => response.data)
    );
  }

  updateProfile(profile: AgentProfile): Observable<AgentProfile> {
    const agentId = this.getAgentId();
    console.debug('[AgentApi] updateProfile', agentId);
    return this.http.put<ApiResponse<AgentProfile>>(`${API_BASE_URL}/api/user/${agentId}`, profile).pipe(
      map(response => response.data)
    );
  }

  // Client workflow actions
  approveClient(clientId: number): Observable<AgentClient> {
    console.debug('[AgentApi] approveClient', clientId);
    return this.http.post<ApiResponse<AgentClient>>(`${API_BASE_URL}/api/user/agent/client/${clientId}/approve`, {}).pipe(
      map(response => response.data)
    );
  }

  rejectClient(clientId: number, reason?: string): Observable<AgentClient> {
    console.debug('[AgentApi] rejectClient', clientId, reason);
    return this.http.post<ApiResponse<AgentClient>>(`${API_BASE_URL}/api/user/agent/client/${clientId}/reject`, { reason }).pipe(
      map(response => response.data)
    );
  }

  suspendClient(clientId: number, reason?: string): Observable<AgentClient> {
    console.debug('[AgentApi] suspendClient', clientId, reason);
    return this.http.post<ApiResponse<AgentClient>>(`${API_BASE_URL}/api/user/agent/client/${clientId}/suspend`, { reason }).pipe(
      map(response => response.data)
    );
  }
}
