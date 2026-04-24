import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

  getByUserId(userId: number): Observable<EcheancePaymentResponse[]> {
    return this.http
      .get<EcheancePaymentResponse[]>(`${API_BASE_URL}/api/echeances/by-user/${userId}`)
      .pipe(timeout(10000));
  }

  getByCreditId(creditId: number): Observable<EcheancePaymentResponse[]> {
    return this.http
      .get<EcheancePaymentResponse[]>(`${API_BASE_URL}/api/echeances/by-credit/${creditId}`)
      .pipe(timeout(10000));
  }

  getByUserIdAndCreditId(userId: number, creditId: number): Observable<EcheancePaymentResponse[]> {
    const params = new HttpParams().set('creditId', creditId.toString());
    return this.http
      .get<EcheancePaymentResponse[]>(`${API_BASE_URL}/api/echeances/by-user/${userId}`, { params })
      .pipe(timeout(10000));
  }

  pay(echeanceId: number, amount: number): Observable<EcheancePaymentResponse> {
    return this.http
      .put<EcheancePaymentResponse>(`${API_BASE_URL}/api/echeances/${echeanceId}/pay`, { amount })
      .pipe(timeout(10000));
  }
}
