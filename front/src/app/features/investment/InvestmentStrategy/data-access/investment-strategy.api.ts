import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../core/http/api.config';
import { InvestmentStrategy } from '../models/investment-strategy.model';

@Injectable({ providedIn: 'root' })
export class InvestmentStrategyApi {
  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<InvestmentStrategy[]> {
    return this.http.get<InvestmentStrategy[]>(`${API_BASE_URL}/api/investments/strategies`);
  }

  findById(id: number): Observable<InvestmentStrategy> {
    return this.http.get<InvestmentStrategy>(`${API_BASE_URL}/api/investments/strategies/${id}`);
  }
}
