import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../core/http/api.config';
import { KycDocument } from '../models/kyc-document.model';

@Injectable({ providedIn: 'root' })
export class KycDocumentApi {
  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<KycDocument[]> {
    return this.http.get<KycDocument[]>(`${API_BASE_URL}/api/kyc-documents`);
  }

  findByUser(userId: number): Observable<KycDocument[]> {
    return this.http.get<KycDocument[]>(`${API_BASE_URL}/api/kyc-documents/user/${userId}`);
  }

  approve(id: number): Observable<KycDocument> {
    return this.http.patch<KycDocument>(`${API_BASE_URL}/api/kyc-documents/${id}/approve`, {});
  }

  reject(id: number): Observable<KycDocument> {
    return this.http.patch<KycDocument>(`${API_BASE_URL}/api/kyc-documents/${id}/reject`, {});
  }
}
