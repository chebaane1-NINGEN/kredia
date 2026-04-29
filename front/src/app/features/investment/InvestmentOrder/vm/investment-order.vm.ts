import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { InvestmentOrderApi } from '../data-access/investment-order.api';
import { InvestmentOrder } from '../models/investment-order.model';

@Injectable({ providedIn: 'root' })
export class InvestmentOrderVm {
  private readonly api = inject(InvestmentOrderApi);

  findAll(): Observable<InvestmentOrder[]> {
    return this.api.findAll();
  }

  findByUser(userId: number): Observable<InvestmentOrder[]> {
    return this.api.findByUser(userId);
  }

  cancel(order: InvestmentOrder): Observable<InvestmentOrder> {
    return this.api.cancel(order);
  }
}
