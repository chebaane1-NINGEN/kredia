import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WalletApi } from '../data-access/wallet.api';
import { Wallet } from '../models/wallet.model';

@Injectable({ providedIn: 'root' })
export class WalletVm {
  private readonly api = inject(WalletApi);

  findAll(): Observable<Wallet[]> {
    return this.api.findAll();
  }

  findByUser(userId: number): Observable<Wallet | null> {
    return this.api.findByUser(userId);
  }

  freeze(id: number): Observable<Wallet> {
    return this.api.freeze(id);
  }

  unfreeze(id: number): Observable<Wallet> {
    return this.api.unfreeze(id);
  }
}
