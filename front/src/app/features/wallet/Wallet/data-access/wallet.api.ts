import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { API_BASE_URL } from '../../../../core/http/api.config';
import { Wallet } from '../models/wallet.model';

@Injectable({ providedIn: 'root' })
export class WalletApi {
  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<Wallet[]> {
    return this.http.get<Wallet[]>(`${API_BASE_URL}/api/wallets`);
  }

  findByUser(userId: number): Observable<Wallet | null> {
    return this.http.get<Wallet>(`${API_BASE_URL}/api/wallets/user/${userId}`).pipe(
      catchError(() => of(null))
    );
  }

  freeze(id: number): Observable<Wallet> {
    return this.http.patch<Wallet>(`${API_BASE_URL}/api/wallets/${id}/freeze`, {});
  }

  unfreeze(id: number): Observable<Wallet> {
    return this.http.patch<Wallet>(`${API_BASE_URL}/api/wallets/${id}/unfreeze`, {});
  }
}
