import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TransactionAuditLogApi } from '../data-access/transaction-audit-log.api';
import { TransactionAuditLog } from '../models/transaction-audit-log.model';

@Injectable({ providedIn: 'root' })
export class TransactionAuditLogVm {
  private readonly api = inject(TransactionAuditLogApi);

  findAll(): Observable<TransactionAuditLog[]> {
    return this.api.findAll();
  }

  findByTransaction(transactionId: number): Observable<TransactionAuditLog[]> {
    return this.api.findByTransaction(transactionId);
  }
}
