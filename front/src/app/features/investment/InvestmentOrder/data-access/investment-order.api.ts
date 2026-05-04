import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../core/http/api.config';
import { InvestmentOrder } from '../models/investment-order.model';

@Injectable({ providedIn: 'root' })
export class InvestmentOrderApi {
  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<InvestmentOrder[]> {
    return this.http.get<InvestmentOrder[]>(`${API_BASE_URL}/api/investment-orders`);
  }

  findByUser(userId: number): Observable<InvestmentOrder[]> {
    return this.http.get<InvestmentOrder[]>(`${API_BASE_URL}/api/investment-orders/user/${userId}`);
  }

  cancel(id: number): Observable<InvestmentOrder> {
    return this.http.patch<InvestmentOrder>(`${API_BASE_URL}/api/investment-orders/${id}/cancel`, {});
  }
}
