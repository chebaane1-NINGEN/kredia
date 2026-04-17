import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';
import { API_BASE_URL } from '../../../../core/http/api.config';
import { EcheancePaymentResponse } from '../models/echeance.model';

@Injectable({ providedIn: 'root' })
export class EcheanceApi {
  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<EcheancePaymentResponse[]> {
    return this.http
      .get<EcheancePaymentResponse[]>(`${API_BASE_URL}/api/echeances`)
      .pipe(timeout(10000));
  }

  pay(echeanceId: number, amount: number): Observable<EcheancePaymentResponse> {
    return this.http
      .put<EcheancePaymentResponse>(`${API_BASE_URL}/api/echeances/${echeanceId}/pay`, { amount })
      .pipe(timeout(10000));
  }
}
