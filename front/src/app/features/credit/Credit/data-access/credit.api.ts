import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';
import { API_BASE_URL } from '../../../../core/http/api.config';
import { Credit, DemandeCredit, DefaultPredictionResponse } from '../models/credit.model';

@Injectable({ providedIn: 'root' })
export class CreditApi {
  constructor(private readonly http: HttpClient) {}

  /** Submit a credit application (client) */
  createDemande(demande: DemandeCredit): Observable<DemandeCredit> {
    return this.http
      .post<DemandeCredit>(`${API_BASE_URL}/api/credits`, demande)
      .pipe(timeout(10000));
  }

  /** @deprecated Use createDemande instead */
  create(credit: Credit): Observable<Credit> {
    return this.http
      .post<Credit>(`${API_BASE_URL}/api/credits`, credit)
      .pipe(timeout(10000));
  }

  predictDefault(id: number): Observable<DefaultPredictionResponse> {
    return this.http
      .post<DefaultPredictionResponse>(`${API_BASE_URL}/api/credits/${id}/predict-default`, {})
      .pipe(timeout(15000));
  }

  /** All official credits (ACTIVE, COMPLETED…) */
  findAll(): Observable<Credit[]> {
    return this.http.get<Credit[]>(`${API_BASE_URL}/api/credits`);
  }

  /** Pending applications (PENDING) */
  getPendingDemandes(): Observable<DemandeCredit[]> {
    return this.http.get<DemandeCredit[]>(`${API_BASE_URL}/api/credits/pending`);
  }

  /** @deprecated Use getPendingDemandes */
  getPendingCredits(): Observable<Credit[]> {
    return this.http.get<Credit[]>(`${API_BASE_URL}/api/credits/pending`);
  }

  approveCredit(id: number): Observable<Credit> {
    return this.http.post<Credit>(`${API_BASE_URL}/api/credits/${id}/approve`, {});
  }

  rejectCredit(id: number): Observable<DemandeCredit> {
    return this.http.post<DemandeCredit>(`${API_BASE_URL}/api/credits/${id}/reject`, {});
  }

  findByUserId(userId: number): Observable<Credit[]> {
    return this.http.get<Credit[]>(`${API_BASE_URL}/api/credits/by-user/${userId}`);
  }

  /** Applications submitted by a specific client */
  findDemandesByUserId(userId: number): Observable<DemandeCredit[]> {
    return this.http.get<DemandeCredit[]>(`${API_BASE_URL}/api/credits/demandes/by-user/${userId}`);
  }

  exportExcel(id: number): Observable<Blob> {
    return this.http.get(`${API_BASE_URL}/api/credits/${id}/export`, {
      responseType: 'blob'
    });
  }

  exportPdf(id: number): Observable<Blob> {
    return this.http.get(`${API_BASE_URL}/api/credits/${id}/statistics/pdf`, {
      responseType: 'blob'
    });
  }
}
