import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { InvestmentStrategyApi, StrategyCreationResponseDTO } from '../data-access/investment-strategy.api';
import { InvestmentStrategy } from '../models/investment-strategy.model';

@Injectable({ providedIn: 'root' })
export class InvestmentStrategyVm {
  private readonly api = inject(InvestmentStrategyApi);

  create(strategy: InvestmentStrategy): Observable<StrategyCreationResponseDTO> {
    return this.api.create(strategy);
  }

  findAll(): Observable<InvestmentStrategy[]> {
    return this.api.findAll();
  }

  findById(id: number): Observable<InvestmentStrategy> {
    return this.api.findById(id);
  }

  update(id: number, strategy: InvestmentStrategy): Observable<InvestmentStrategy> {
    return this.api.update(id, strategy);
  }

  delete(id: number): Observable<void> {
    return this.api.delete(id);
  }
}
