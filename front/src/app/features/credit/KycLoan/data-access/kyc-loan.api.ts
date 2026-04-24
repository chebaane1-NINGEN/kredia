import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { KycLoanResponse, DocumentTypeLoan } from '../models/kyc-loan.model';

const BASE = 'http://127.0.0.1:8081/api/kyc-loans';

@Injectable({ providedIn: 'root' })
export class KycLoanApi {
  private readonly http = inject(HttpClient);

  /** Upload a document file via multipart/form-data */
  upload(
    creditId: number,
    userId: number,
    documentType: DocumentTypeLoan,
    file: File
  ): Observable<KycLoanResponse> {
    const formData = new FormData();
    formData.append('creditId', creditId.toString());
    formData.append('userId', userId.toString());
    formData.append('documentType', documentType);
    formData.append('file', file, file.name);
    return this.http.post<KycLoanResponse>(`${BASE}/upload`, formData);
  }

  /** Force verify (triggers APPROVED / REJECTED from backend via AI) */
  verify(kycLoanId: number): Observable<KycLoanResponse> {
    return this.http.put<KycLoanResponse>(`${BASE}/${kycLoanId}/verify`, {});
  }

  approve(kycLoanId: number): Observable<KycLoanResponse> {
    return this.http.put<KycLoanResponse>(`${BASE}/${kycLoanId}/approve`, {});
  }

  reject(kycLoanId: number): Observable<KycLoanResponse> {
    return this.http.put<KycLoanResponse>(`${BASE}/${kycLoanId}/reject`, {});
  }

  getAll(): Observable<KycLoanResponse[]> {
    return this.http.get<KycLoanResponse[]>(BASE);
  }

  /** Get all docs for a credit */
  getByCreditId(creditId: number): Observable<KycLoanResponse[]> {
    return this.http.get<KycLoanResponse[]>(`${BASE}/credit/${creditId}`);
  }

  /** Get all docs for a user */
  getByUserId(userId: number): Observable<KycLoanResponse[]> {
    return this.http.get<KycLoanResponse[]>(`${BASE}/by-user/${userId}`);
  }

  /** Get all docs for a demande */
  getByDemandeId(demandeId: number): Observable<KycLoanResponse[]> {
    return this.http.get<KycLoanResponse[]>(`${BASE}/by-demande/${demandeId}`);
  }

  /** Fix credit_id for all KYC loans with null credit */
  fixCreditLinks(): Observable<string> {
    return this.http.post(`${BASE}/fix-credit-links`, {}, { responseType: 'text' });
  }
}
