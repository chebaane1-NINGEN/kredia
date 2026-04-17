import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreditApi } from '../data-access/credit.api';
import { Credit, DefaultPredictionResponse } from '../models/credit.model';

/**
 * VM (Service) — couche données pour Credit.
 * Expose des Observables. Aucun état UI.
 */
@Injectable({ providedIn: 'root' })
export class CreditVm {
  private readonly api = inject(CreditApi);

  findAll(): Observable<Credit[]> {
    return this.api.findAll();
  }

  create(credit: Credit): Observable<Credit> {
    return this.api.create(credit);
  }

  predictDefault(id: number): Observable<DefaultPredictionResponse> {
    return this.api.predictDefault(id);
  }

  exportExcel(id: number): Observable<Blob> {
    return this.api.exportExcel(id);
  }

  exportPdf(id: number): Observable<Blob> {
    return this.api.exportPdf(id);
  }
}
