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

  /** Force verify (triggers APPROVED / REJECTED from backend) */
  verify(kycLoanId: number): Observable<KycLoanResponse> {
    return this.http.put<KycLoanResponse>(`${BASE}/${kycLoanId}/verify`, {});
  }

  /** Get all docs for a credit */
  getByCreditId(creditId: number): Observable<KycLoanResponse[]> {
    return this.http.get<KycLoanResponse[]>(`${BASE}/credit/${creditId}`);
  }
}
