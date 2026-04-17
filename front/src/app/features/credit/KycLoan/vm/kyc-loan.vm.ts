import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { KycLoanApi } from '../data-access/kyc-loan.api';
import { DocumentTypeLoan, KycLoanResponse } from '../models/kyc-loan.model';

/**
 * VM (Service) — couche données pour KycLoan.
 * Orchestre les appels API et expose des Observables.
 * Aucun état UI ici.
 */
@Injectable({ providedIn: 'root' })
export class KycLoanVm {
  private readonly api = inject(KycLoanApi);

  upload(
    creditId: number,
    userId: number,
    documentType: DocumentTypeLoan,
    file: File
  ): Observable<KycLoanResponse> {
    return this.api.upload(creditId, userId, documentType, file);
  }

  verify(kycLoanId: number): Observable<KycLoanResponse> {
    return this.api.verify(kycLoanId);
  }

  getByCreditId(creditId: number): Observable<KycLoanResponse[]> {
    return this.api.getByCreditId(creditId);
  }
}
