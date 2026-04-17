import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { TransactionVm } from '../../vm/transaction.vm';
import { Transaction } from '../../models/transaction.model';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transaction-page.component.html',
  styleUrl: './transaction-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionPageComponent implements OnInit {
  private readonly vm  = inject(TransactionVm);
  private readonly cdr = inject(ChangeDetectorRef);

  transactions: Transaction[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.loading = true;
    this.error   = null;
    this.cdr.markForCheck();

    this.vm.findAll()
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next:  (data) => { this.transactions = data ?? []; this.cdr.markForCheck(); },
        error: ()     => { this.error = 'Unable to load transactions.'; this.cdr.markForCheck(); }
      });
  }

  getTypeClass(type: string): string {
    return `type--${type.toLowerCase().replace('_', '-')}`;
  }

  getStatusClass(status: string): string {
    return `status--${status.toLowerCase()}`;
  }
}
