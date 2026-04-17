import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';
import { API_BASE_URL } from '../../../../core/http/api.config';
import { Credit, DefaultPredictionResponse } from '../models/credit.model';

@Injectable({ providedIn: 'root' })
export class CreditApi {
  constructor(private readonly http: HttpClient) {}

  create(credit: Credit): Observable<Credit> {
    return this.http
      .post<Credit>(`${API_BASE_URL}/api/credits`, credit)
      .pipe(timeout(10000));
  }

  predictDefault(id: number): Observable<DefaultPredictionResponse> {
    return this.http
      .post<DefaultPredictionResponse>(`${API_BASE_URL}/api/credits/${id}/predict-default`, {})
      .pipe(timeout(15000));
  }

  findAll(): Observable<Credit[]> {
    return this.http.get<Credit[]>(`${API_BASE_URL}/api/credits`);
  }

  exportExcel(id: number): Observable<Blob> {
    return this.http.get(`${API_BASE_URL}/api/credits/${id}/export`, {
      responseType: 'blob'
    });
  }

  exportPdf(id: number): Observable<Blob> {
    return this.http.get(`${API_BASE_URL}/api/credits/${id}/statistics/pdf`, {
      responseType: 'blob'
    });
  }
}
