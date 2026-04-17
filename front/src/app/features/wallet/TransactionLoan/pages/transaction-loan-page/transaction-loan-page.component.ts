import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { TransactionLoanVm } from '../../vm/transaction-loan.vm';
import { TransactionLoan } from '../../models/transaction-loan.model';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transaction-loan-page.component.html',
  styleUrl: './transaction-loan-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionLoanPageComponent implements OnInit {
  private readonly vm  = inject(TransactionLoanVm);
  private readonly cdr = inject(ChangeDetectorRef);

  transactions: TransactionLoan[] = [];
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
        error: ()     => { this.error = 'Unable to load loan transactions.'; this.cdr.markForCheck(); }
      });
  }

  getTypeClass(type: string): string {
    return `type--${type.toLowerCase()}`;
  }
}
