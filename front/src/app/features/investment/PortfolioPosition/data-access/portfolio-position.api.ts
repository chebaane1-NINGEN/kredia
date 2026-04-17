import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../core/http/api.config';
import { PortfolioPosition } from '../models/portfolio-position.model';

@Injectable({ providedIn: 'root' })
export class PortfolioPositionApi {
  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<PortfolioPosition[]> {
    return this.http.get<PortfolioPosition[]>(`${API_BASE_URL}/api/portfolio-positions`);
  }

  findByUser(userId: number): Observable<PortfolioPosition[]> {
    return this.http.get<PortfolioPosition[]>(`${API_BASE_URL}/api/portfolio-positions/user/${userId}`);
  }
}
