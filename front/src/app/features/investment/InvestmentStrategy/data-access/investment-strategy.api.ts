import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../../../../core/http/api.config';
import { InvestmentStrategy } from '../models/investment-strategy.model';

export interface StrategyCreationResponseDTO {
  strategy: InvestmentStrategy;
  createdPositions: unknown[];
  message: string;
}

@Injectable({ providedIn: 'root' })
export class InvestmentStrategyApi {
  constructor(private readonly http: HttpClient) {}

  create(strategy: InvestmentStrategy): Observable<StrategyCreationResponseDTO> {
    return this.http
      .post<StrategyCreationResponseDTO>(`${API_BASE_URL}/api/investments/strategies`, strategy);
  }

  findAll(): Observable<InvestmentStrategy[]> {
    return this.http.get<InvestmentStrategy[]>(`${API_BASE_URL}/api/investments/strategies`);
  }

  findById(id: number): Observable<InvestmentStrategy> {
    return this.http.get<InvestmentStrategy>(`${API_BASE_URL}/api/investments/strategies/${id}`);
  }

  update(id: number, strategy: InvestmentStrategy): Observable<InvestmentStrategy> {
    return this.http.put<InvestmentStrategy>(`${API_BASE_URL}/api/investments/strategies/${id}`, strategy);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/api/investments/strategies/${id}`);
  }
}
