import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { InvestmentStrategyApi } from '../data-access/investment-strategy.api';
import { InvestmentStrategy } from '../models/investment-strategy.model';

@Injectable({ providedIn: 'root' })
export class InvestmentStrategyVm {
  private readonly api = inject(InvestmentStrategyApi);

  findAll(): Observable<InvestmentStrategy[]> {
    return this.api.findAll();
  }

  findById(id: number): Observable<InvestmentStrategy> {
    return this.api.findById(id);
  }
}
