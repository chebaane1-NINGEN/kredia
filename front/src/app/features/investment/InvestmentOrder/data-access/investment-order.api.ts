import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../core/http/api.config';
import { InvestmentOrder } from '../models/investment-order.model';

@Injectable({ providedIn: 'root' })
export class InvestmentOrderApi {
  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<InvestmentOrder[]> {
    return this.http.get<InvestmentOrder[]>(`${API_BASE_URL}/api/investments/orders`);
  }

  findByUser(userId: number): Observable<InvestmentOrder[]> {
    return this.http.get<InvestmentOrder[]>(`${API_BASE_URL}/api/investments/orders/user/${userId}`);
  }

  cancel(order: InvestmentOrder): Observable<InvestmentOrder> {
    return this.http.put<InvestmentOrder>(
      `${API_BASE_URL}/api/investments/orders/${order.orderId}`,
      {
        ...order,
        orderStatus: 'CANCELLED'
      }
    );
  }
}
