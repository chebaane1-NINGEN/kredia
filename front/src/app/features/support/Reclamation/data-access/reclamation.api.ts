import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../core/http/api.config';
import { Reclamation, ReclamationStatus } from '../models/reclamation.model';

@Injectable({ providedIn: 'root' })
export class ReclamationApi {
  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<Reclamation[]> {
    return this.http.get<Reclamation[]>(`${API_BASE_URL}/api/reclamations`);
  }

  findById(id: number): Observable<Reclamation> {
    return this.http.get<Reclamation>(`${API_BASE_URL}/api/reclamations/${id}`);
  }

  updateStatus(id: number, status: ReclamationStatus): Observable<Reclamation> {
    return this.http.patch<Reclamation>(`${API_BASE_URL}/api/reclamations/${id}/status`, { status });
  }
}
