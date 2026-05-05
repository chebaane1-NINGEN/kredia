import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../core/http/api.config';
import { PortfolioPosition } from '../models/portfolio-position.model';

@Injectable({ providedIn: 'root' })
export class PortfolioPositionApi {
  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<PortfolioPosition[]> {
    return this.http.get<PortfolioPosition[]>(`${API_BASE_URL}/api/investments/positions`);
  }

  findByUser(userId: number): Observable<PortfolioPosition[]> {
    return this.http.get<PortfolioPosition[]>(`${API_BASE_URL}/api/investments/positions/user/${userId}`);
  }

  create(position: PortfolioPosition): Observable<PortfolioPosition> {
    return this.http.post<PortfolioPosition>(`${API_BASE_URL}/api/investments/positions`, position);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/api/investments/positions/${id}`);
  }

  findByStrategy(strategyId: number): Observable<PortfolioPosition[]> {
    return this.http.get<PortfolioPosition[]>(
      `${API_BASE_URL}/api/investments/positions/strategy/${strategyId}`
    );
  }
}
