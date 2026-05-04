import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../core/http/api.config';
import { ReclamationMessage, ReclamationMessageCreateRequest } from '../models/reclamation-message.model';

@Injectable({ providedIn: 'root' })
export class ReclamationMessageApi {
  constructor(private readonly http: HttpClient) {}

  findByReclamation(reclamationId: number, includeInternal = false): Observable<ReclamationMessage[]> {
    return this.http.get<ReclamationMessage[]>(`${API_BASE_URL}/api/reclamations/${reclamationId}/messages`, {
      params: { includeInternal }
    });
  }

  send(reclamationId: number, request: ReclamationMessageCreateRequest): Observable<ReclamationMessage> {
    return this.http.post<ReclamationMessage>(`${API_BASE_URL}/api/reclamations/${reclamationId}/messages`, request);
  }
}
