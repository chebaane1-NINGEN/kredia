import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../core/http/api.config';
import { ReclamationAttachment } from '../models/reclamation-attachment.model';

@Injectable({ providedIn: 'root' })
export class ReclamationAttachmentApi {
  constructor(private readonly http: HttpClient) {}

  findByReclamation(reclamationId: number): Observable<ReclamationAttachment[]> {
    return this.http.get<ReclamationAttachment[]>(`${API_BASE_URL}/api/reclamations/${reclamationId}/attachments`);
  }

  upload(reclamationId: number, uploadedByUserId: number, file: File): Observable<ReclamationAttachment> {
    const body = new FormData();
    body.append('file', file);

    return this.http.post<ReclamationAttachment>(`${API_BASE_URL}/api/reclamations/${reclamationId}/attachments`, body, {
      params: { uploadedByUserId }
    });
  }
}
