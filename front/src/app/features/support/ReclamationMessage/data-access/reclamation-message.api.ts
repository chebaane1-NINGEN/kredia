import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../core/http/api.config';
import { ReclamationMessage } from '../models/reclamation-message.model';

@Injectable({ providedIn: 'root' })
export class ReclamationMessageApi {
  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<ReclamationMessage[]> {
    return this.http.get<ReclamationMessage[]>(`${API_BASE_URL}/api/reclamation-messages`);
  }

  findByReclamation(reclamationId: number): Observable<ReclamationMessage[]> {
    return this.http.get<ReclamationMessage[]>(`${API_BASE_URL}/api/reclamation-messages/reclamation/${reclamationId}`);
  }

  send(message: ReclamationMessage): Observable<ReclamationMessage> {
    return this.http.post<ReclamationMessage>(`${API_BASE_URL}/api/reclamation-messages`, message);
  }
}
