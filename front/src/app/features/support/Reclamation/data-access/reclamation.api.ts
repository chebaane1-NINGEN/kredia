import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../core/http/api.config';
import {
  Reclamation,
  ReclamationAssignRequest,
  ReclamationAttachment,
  ReclamationCreateRequest,
  ReclamationDashboard,
  ReclamationFeedbackRequest,
  ReclamationHistory,
  ReclamationMessage,
  ReclamationMessageCreateRequest,
  ReclamationStatus,
  ReclamationStatusUpdateRequest,
  ReclamationUpdateRequest,
  RiskScoreResponse,
  SpringPage
} from '../models/reclamation.model';

@Injectable({ providedIn: 'root' })
export class ReclamationApi {
  private readonly baseUrl = `${API_BASE_URL}/api/reclamations`;

  constructor(private readonly http: HttpClient) {}

  create(request: ReclamationCreateRequest): Observable<Reclamation> {
    return this.http.post<Reclamation>(this.baseUrl, request);
  }

  update(id: number, request: ReclamationUpdateRequest): Observable<Reclamation> {
    return this.http.put<Reclamation>(`${this.baseUrl}/${id}`, request);
  }

  updateStatus(id: number, request: ReclamationStatusUpdateRequest): Observable<Reclamation> {
    return this.http.patch<Reclamation>(`${this.baseUrl}/${id}/status`, request);
  }

  assign(id: number, request: ReclamationAssignRequest): Observable<Reclamation> {
    return this.http.patch<Reclamation>(`${this.baseUrl}/${id}/assign`, request);
  }

  dashboard(): Observable<ReclamationDashboard> {
    return this.http.get<ReclamationDashboard>(`${this.baseUrl}/dashboard`);
  }

  findAll(page = 0, size = 10): Observable<SpringPage<Reclamation>> {
    return this.http.get<SpringPage<Reclamation>>(this.baseUrl, {
      params: { page, size }
    });
  }

  findById(id: number): Observable<Reclamation> {
    return this.http.get<Reclamation>(`${this.baseUrl}/${id}`);
  }

  findByUser(userId: number, page = 0, size = 10): Observable<SpringPage<Reclamation>> {
    return this.http.get<SpringPage<Reclamation>>(`${this.baseUrl}/by-user/${userId}`, {
      params: { page, size }
    });
  }

  findByStatus(status: ReclamationStatus, page = 0, size = 10): Observable<SpringPage<Reclamation>> {
    return this.http.get<SpringPage<Reclamation>>(`${this.baseUrl}/by-status`, {
      params: { status, page, size }
    });
  }

  getRisk(id: number): Observable<RiskScoreResponse> {
    return this.http.get<RiskScoreResponse>(`${this.baseUrl}/${id}/risk`);
  }

  getHistory(id: number): Observable<ReclamationHistory[]> {
    return this.http.get<ReclamationHistory[]>(`${this.baseUrl}/${id}/history`);
  }

  addMessage(id: number, request: ReclamationMessageCreateRequest): Observable<ReclamationMessage> {
    return this.http.post<ReclamationMessage>(`${this.baseUrl}/${id}/messages`, request);
  }

  getMessages(id: number, includeInternal = false): Observable<ReclamationMessage[]> {
    return this.http.get<ReclamationMessage[]>(`${this.baseUrl}/${id}/messages`, {
      params: { includeInternal }
    });
  }

  addAttachment(id: number, uploadedByUserId: number, file: File): Observable<ReclamationAttachment> {
    const body = new FormData();
    body.append('file', file);

    return this.http.post<ReclamationAttachment>(`${this.baseUrl}/${id}/attachments`, body, {
      params: { uploadedByUserId }
    });
  }

  getAttachments(id: number): Observable<ReclamationAttachment[]> {
    return this.http.get<ReclamationAttachment[]>(`${this.baseUrl}/${id}/attachments`);
  }

  submitFeedback(id: number, request: ReclamationFeedbackRequest): Observable<Reclamation> {
    return this.http.post<Reclamation>(`${this.baseUrl}/${id}/feedback`, request);
  }

  getDuplicateCandidates(id: number): Observable<Reclamation[]> {
    return this.http.get<Reclamation[]>(`${this.baseUrl}/${id}/duplicates`);
  }

  exportPdf(id: number, includeInternal = false): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/export/pdf`, {
      params: { includeInternal },
      responseType: 'blob'
    });
  }
}
