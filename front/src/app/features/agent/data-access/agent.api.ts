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
    status?: string,
    page = 0,
    size = 10,
    sortBy?: string,
    sortDirection?: string
  ): Observable<PageResponse<AgentClient>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (email) params = params.set('email', email);
    if (status) params = params.set('status', status);
    if (sortBy) params = params.set('sortBy', sortBy);
    if (sortDirection) params = params.set('sortDirection', sortDirection);

    console.debug('[AgentApi] getClients', { email, status, page, size });
    return this.http.get<ApiResponse<PageResponse<AgentClient>>>(`${API_BASE_URL}/api/user/agent/clients`, { params }).pipe(
      map(response => response.data)
    );
  }

  // Client Details
  getClientDetails(clientId: number): Observable<ClientDetails> {
    console.debug('[AgentApi] getClientDetails', clientId);
    return this.http.get<ApiResponse<ClientDetails>>(`${API_BASE_URL}/api/user/client/${clientId}/profile`).pipe(
      map(response => response.data)
    );
  }

  // Performance
  getPerformance(): Observable<AgentPerformance> {
    const agentId = this.getAgentId();
    console.debug('[AgentApi] getPerformance', agentId);
    return this.http.get<ApiResponse<AgentPerformance>>(`${API_BASE_URL}/api/user/agent/${agentId}/performance`).pipe(
      map(response => response.data)
    );
  }

  // Activity/Audit
  getActivity(page = 0, size = 20): Observable<PageResponse<AgentActivity>> {
    const agentId = this.getAgentId();
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    console.debug('[AgentApi] getActivity', { agentId, page, size });
    return this.http.get<ApiResponse<PageResponse<AgentActivity>>>(`${API_BASE_URL}/api/user/agent/${agentId}/activity`, { params }).pipe(
      map(response => response.data)
    );
  }

  // Update client
  updateClient(clientId: number, updates: Partial<AgentClient>): Observable<AgentClient> {
    return this.http.put<ApiResponse<AgentClient>>(`${API_BASE_URL}/api/user/${clientId}`, updates).pipe(
      map(response => response.data)
    );
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