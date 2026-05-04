import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../core/http/api.config';
import { VirtualCard } from '../models/virtual-card.model';

@Injectable({ providedIn: 'root' })
export class VirtualCardApi {
  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<VirtualCard[]> {
    return this.http.get<VirtualCard[]>(`${API_BASE_URL}/api/virtual-cards`);
  }

  findByUser(userId: number): Observable<VirtualCard[]> {
    return this.http.get<VirtualCard[]>(`${API_BASE_URL}/api/virtual-cards/user/${userId}`);
  }

  block(id: number): Observable<VirtualCard> {
    return this.http.patch<VirtualCard>(`${API_BASE_URL}/api/virtual-cards/${id}/block`, {});
  }

  unblock(id: number): Observable<VirtualCard> {
    return this.http.patch<VirtualCard>(`${API_BASE_URL}/api/virtual-cards/${id}/unblock`, {});
  }
}
