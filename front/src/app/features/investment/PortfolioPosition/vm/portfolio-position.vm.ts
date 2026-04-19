import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PortfolioPositionApi } from '../data-access/portfolio-position.api';
import { PortfolioPosition } from '../models/portfolio-position.model';

@Injectable({ providedIn: 'root' })
export class PortfolioPositionVm {
  private readonly api = inject(PortfolioPositionApi);

  findAll(): Observable<PortfolioPosition[]> {
    return this.api.findAll();
  }

  findByUser(userId: number): Observable<PortfolioPosition[]> {
    return this.api.findByUser(userId);
  }
}
