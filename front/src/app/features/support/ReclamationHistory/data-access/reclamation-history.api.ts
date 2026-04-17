import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../core/http/api.config';
import { ReclamationHistory } from '../models/reclamation-history.model';

@Injectable({ providedIn: 'root' })
export class ReclamationHistoryApi {
  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<ReclamationHistory[]> {
    return this.http.get<ReclamationHistory[]>(`${API_BASE_URL}/api/reclamation-history`);
  }

  findByReclamation(reclamationId: number): Observable<ReclamationHistory[]> {
    return this.http.get<ReclamationHistory[]>(`${API_BASE_URL}/api/reclamation-history/reclamation/${reclamationId}`);
  }
}
