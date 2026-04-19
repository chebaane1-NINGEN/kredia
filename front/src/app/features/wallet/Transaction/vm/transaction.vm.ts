import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TransactionApi } from '../data-access/transaction.api';
import { Transaction } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionVm {
  private readonly api = inject(TransactionApi);

  findAll(): Observable<Transaction[]> {
    return this.api.findAll();
  }

  findByWallet(walletId: number): Observable<Transaction[]> {
    return this.api.findByWallet(walletId);
  }
}
