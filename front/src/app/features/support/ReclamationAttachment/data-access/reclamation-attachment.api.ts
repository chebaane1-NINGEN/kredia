import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../core/http/api.config';
import { ReclamationAttachment } from '../models/reclamation-attachment.model';

@Injectable({ providedIn: 'root' })
export class ReclamationAttachmentApi {
  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<ReclamationAttachment[]> {
    return this.http.get<ReclamationAttachment[]>(`${API_BASE_URL}/api/reclamation-attachments`);
  }

  findByReclamation(reclamationId: number): Observable<ReclamationAttachment[]> {
    return this.http.get<ReclamationAttachment[]>(`${API_BASE_URL}/api/reclamation-attachments/reclamation/${reclamationId}`);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/api/reclamation-attachments/${id}`);
  }
}
