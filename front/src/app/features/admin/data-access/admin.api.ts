import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/http/api.config';
import {
  AdminStats,
  AgentPerformance,
  ApiResponse,
  PageResponse,
  SystemDashboardStats,
  UserActivity,
  UserResponse,
  UserRole,
  UserStatus
} from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminApi {
  constructor(private readonly http: HttpClient) {}

  findUsers(
    query?: string,
    role?: UserRole,
    status?: UserStatus,
    page = 0,
    size = 10
  ): Observable<PageResponse<UserResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (query) params = params.set('email', query);
    if (role) params = params.set('role', role);
    if (status) params = params.set('status', status);

    return this.http.get<ApiResponse<PageResponse<UserResponse>>>(`${API_BASE_URL}/api/user`, { params }).pipe(
      map(response => response.data)
    );
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${API_BASE_URL}/api/user/${id}`).pipe(
      map(() => undefined)
    );
  }

  blockUser(id: number): Observable<UserResponse> {
    return this.http.patch<ApiResponse<UserResponse>>(`${API_BASE_URL}/api/user/${id}/block`, {}).pipe(
      map(response => response.data)
    );
  }

  activateUser(id: number): Observable<UserResponse> {
    return this.http.patch<ApiResponse<UserResponse>>(`${API_BASE_URL}/api/user/${id}/activate`, {}).pipe(
      map(response => response.data)
    );
  }

  changeUserRole(id: number, role: UserRole): Observable<UserResponse> {
    return this.http.patch<ApiResponse<UserResponse>>(`${API_BASE_URL}/api/user/${id}/role`, { role }).pipe(
      map(response => response.data)
    );
  }

  bulkDelete(ids: number[]): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${API_BASE_URL}/api/user/admin/bulk-delete`, {
      body: ids
    }).pipe(map(() => undefined));
  }

  bulkUpdateStatus(ids: number[], status: UserStatus): Observable<void> {
    const params = new HttpParams().set('status', status);
    return this.http.patch<ApiResponse<void>>(`${API_BASE_URL}/api/user/admin/bulk-status`, ids, { params }).pipe(
      map(() => undefined)
    );
  }

  getAdminStats(): Observable<AdminStats> {
    return this.http.get<ApiResponse<AdminStats>>(`${API_BASE_URL}/api/user/admin/stats`).pipe(
      map(response => response.data)
    );
  }

  getSystemDashboardStats(): Observable<SystemDashboardStats> {
    return this.http.get<SystemDashboardStats>(`${API_BASE_URL}/api/statistics/dashboard`);
  }

  getAgents(page = 0, size = 10): Observable<PageResponse<UserResponse>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<ApiResponse<PageResponse<UserResponse>>>(`${API_BASE_URL}/api/user/admin/agents`, { params }).pipe(
      map(response => response.data)
    );
  }

  getAgentPerformance(agentId: number): Observable<AgentPerformance> {
    return this.http.get<ApiResponse<AgentPerformance>>(`${API_BASE_URL}/api/user/agent/${agentId}/performance`).pipe(
      map(response => response.data)
    );
  }

  getAgentClients(page = 0, size = 10): Observable<PageResponse<UserResponse>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<ApiResponse<PageResponse<UserResponse>>>(`${API_BASE_URL}/api/user/agent/clients`, { params }).pipe(
      map(response => response.data)
    );
  }

  assignClient(agentId: number, clientId: number): Observable<UserResponse> {
    const params = new HttpParams().set('agentId', agentId.toString()).set('clientId', clientId.toString());
    return this.http.post<ApiResponse<UserResponse>>(`${API_BASE_URL}/api/user/admin/assign`, null, { params }).pipe(
      map(response => response.data)
    );
  }

  unassignClient(clientId: number): Observable<UserResponse> {
    const params = new HttpParams().set('clientId', clientId.toString());
    return this.http.delete<ApiResponse<UserResponse>>(`${API_BASE_URL}/api/user/admin/assign`, { params }).pipe(
      map(response => response.data)
    );
  }

  getActivities(role?: UserRole, page = 0, size = 20): Observable<PageResponse<UserActivity>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    if (role) params = params.set('role', role);
    return this.http.get<ApiResponse<PageResponse<UserActivity>>>(`${API_BASE_URL}/api/user/admin/activities`, { params }).pipe(
      map(response => response.data)
    );
  }
}
