import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../core/http/api.config';
import { Transaction } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionApi {
  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${API_BASE_URL}/api/transactions`);
  }

  findByWallet(walletId: number): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${API_BASE_URL}/api/transactions/wallet/${walletId}`);
  }
}
