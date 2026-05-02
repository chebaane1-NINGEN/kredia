import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of, catchError } from 'rxjs';
import { API_BASE_URL } from '../../../../core/http/api.config';
import { User, UserStatus, ClientProfile, ClientRiskScore, ClientEligibility, UserActivity, ActivityPage, PasswordChangeRequest, ProfileUpdateRequest, ScoreHistoryPoint, FinancialMetrics, SmartAlert, AIInsight } from '../models/user.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class UserApi {
  private readonly USER_BASE = `${API_BASE_URL}/api/user`;
  private readonly CLIENT_BASE = `${this.USER_BASE}/client`;

  constructor(private readonly http: HttpClient) {}

  // ==================== Admin/List Users ====================
  findAll(query?: string, role?: string, status?: UserStatus, page = 0, size = 20): Observable<{ users: User[]; totalElements: number }> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());

    if (query) {
      params = params.set('email', query);
    }
    if (role) {
      params = params.set('role', role);
    }
    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<ApiResponse<PageResponse<User>>>(`${this.USER_BASE}`, { params }).pipe(
      map(response => ({
        users: response.data?.content ?? [],
        totalElements: response.data?.totalElements ?? 0
      }))
    );
  }

  findById(id: number): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.USER_BASE}/${id}`).pipe(
      map(response => response.data)
    );
  }

  updateStatus(id: number, status: UserStatus): Observable<User> {
    return this.http.patch<ApiResponse<User>>(`${this.USER_BASE}/${id}/status`, { status }).pipe(
      map(response => response.data)
    );
  }

  // ==================== Client Profile ====================
  getClientProfile(clientId: number): Observable<ClientProfile> {
    return this.http.get<ApiResponse<ClientProfile>>(`${this.CLIENT_BASE}/${clientId}/profile`).pipe(
      map(response => response.data)
    );
  }

  updateClientProfile(clientId: number, profileUpdate: ProfileUpdateRequest): Observable<ClientProfile> {
    return this.http.put<ApiResponse<ClientProfile>>(`${this.CLIENT_BASE}/${clientId}/profile`, profileUpdate).pipe(
      map(response => response.data)
    );
  }

  // ==================== Client Score & Eligibility ====================
  getClientRiskScore(clientId: number): Observable<ClientRiskScore> {
    return this.http.get<ApiResponse<ClientRiskScore>>(`${this.CLIENT_BASE}/${clientId}/risk-score`).pipe(
      map(response => response.data)
    );
  }

  getClientEligibility(clientId: number): Observable<ClientEligibility> {
    return this.http.get<ApiResponse<ClientEligibility>>(`${this.CLIENT_BASE}/${clientId}/eligibility`).pipe(
      map(response => response.data)
    );
  }

  // Score history for timeline visualization (fetch from backend or calculate internally)
  getScoreHistory(clientId: number, days = 90): Observable<ScoreHistoryPoint[]> {
    const params = new HttpParams().set('days', days.toString());
    return this.http.get<ApiResponse<ScoreHistoryPoint[]>>(`${this.CLIENT_BASE}/${clientId}/score-history`, { params }).pipe(
      map(response => response.data ?? []),
      catchError((err) => {
        // Fallback: If endpoint not available, return empty array
        console.warn('Score history endpoint not available, using fallback');
        return of([]);
      })
    );
  }

  // Financial metrics for dashboard KPIs
  getFinancialMetrics(clientId: number): Observable<FinancialMetrics> {
    return this.http.get<ApiResponse<FinancialMetrics>>(`${this.CLIENT_BASE}/${clientId}/financial-metrics`)
      .pipe(
        map(response => response.data),
        map(metrics => metrics ?? this.generateDefaultMetrics())
      );
  }

  // Smart alerts about score and status changes
  getSmartAlerts(clientId: number): Observable<SmartAlert[]> {
    return this.http.get<ApiResponse<SmartAlert[]>>(`${this.CLIENT_BASE}/${clientId}/alerts`)
      .pipe(
        map(response => response.data ?? [])
      );
  }

  // AI insights about user financial behavior
  getAIInsights(clientId: number): Observable<AIInsight[]> {
    return this.http.get<ApiResponse<AIInsight[]>>(`${this.CLIENT_BASE}/${clientId}/insights`)
      .pipe(
        map(response => response.data ?? [])
      );
  }

  // ==================== Client Activity Log ====================
  getClientActivity(clientId: number, page = 0, size = 20): Observable<ActivityPage> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<ApiResponse<PageResponse<UserActivity>>>(`${this.CLIENT_BASE}/${clientId}/activity`, { params }).pipe(
      map(response => ({
        activities: response.data?.content ?? [],
        totalPages: response.data?.totalPages ?? 0,
        totalElements: response.data?.totalElements ?? 0,
        currentPage: response.data?.number ?? 0
      }))
    );
  }

  getClientActivityFiltered(clientId: number, activityType?: string, page = 0, size = 20): Observable<ActivityPage> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (activityType) {
      params = params.set('type', activityType);
    }

    return this.http.get<ApiResponse<PageResponse<UserActivity>>>(`${this.CLIENT_BASE}/${clientId}/activity`, { params }).pipe(
      map(response => ({
        activities: response.data?.content ?? [],
        totalPages: response.data?.totalPages ?? 0,
        totalElements: response.data?.totalElements ?? 0,
        currentPage: response.data?.number ?? 0
      }))
    );
  }

  // ==================== Password Management ====================
  changePassword(userId: number, request: PasswordChangeRequest): Observable<{ message: string }> {
    return this.http.patch<ApiResponse<{ message: string }>>(`${this.USER_BASE}/${userId}/password`, request).pipe(
      map(response => response.data)
    );
  }

  // ==================== Role-Based Access ====================
  getCurrentUserRole(): Observable<string> {
    return this.http.get<ApiResponse<{ role: string }>>(`${this.USER_BASE}/current/role`).pipe(
      map(response => response.data.role)
    );
  }

  // ==================== Export Function ====================
  exportProfileReport(clientId: number, format: 'pdf' | 'csv' = 'pdf'): Observable<Blob> {
    return this.http.get(`${this.CLIENT_BASE}/${clientId}/export?format=${format}`, {
      responseType: 'blob'
    });
  }

  // ==================== Helper Methods ====================
  private generateDefaultMetrics(): FinancialMetrics {
    return {
      accountHealth: 50,
      riskLevel: 'MEDIUM',
      activityLevel: 'LOW',
      accountAgeMonths: 0,
      daysSinceLastActivity: 0,
      totalActivityCount: 0
    };
  }
}
