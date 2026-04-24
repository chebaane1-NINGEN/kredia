import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { EcheanceApi } from '../data-access/echeance.api';
import { EcheancePaymentResponse } from '../models/echeance.model';

/**
 * VM (Service) — couche données pour Echeance.
 * Expose des Observables. Aucun état UI.
 */
@Injectable({ providedIn: 'root' })
export class EcheanceVm {
  private readonly api = inject(EcheanceApi);

  getAll(): Observable<EcheancePaymentResponse[]> {
    return this.api.getAll();
  }

  getByUserId(userId: number): Observable<EcheancePaymentResponse[]> {
    return this.api.getByUserId(userId);
  }

  getByCreditId(creditId: number): Observable<EcheancePaymentResponse[]> {
    return this.api.getByCreditId(creditId);
  }

  getByUserIdAndCreditId(userId: number, creditId: number): Observable<EcheancePaymentResponse[]> {
    return this.api.getByUserIdAndCreditId(userId, creditId);
  }

  pay(echeanceId: number, amount: number): Observable<EcheancePaymentResponse> {
    return this.api.pay(echeanceId, amount);
  }
}
