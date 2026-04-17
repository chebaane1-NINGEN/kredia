import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { TransactionAuditLogVm } from '../../vm/transaction-audit-log.vm';
import { TransactionAuditLog } from '../../models/transaction-audit-log.model';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transaction-audit-log-page.component.html',
  styleUrl: './transaction-audit-log-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionAuditLogPageComponent implements OnInit {
  private readonly vm  = inject(TransactionAuditLogVm);
  private readonly cdr = inject(ChangeDetectorRef);

  logs: TransactionAuditLog[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading = true;
    this.error   = null;
    this.cdr.markForCheck();

    this.vm.findAll()
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next:  (data) => { this.logs = data ?? []; this.cdr.markForCheck(); },
        error: ()     => { this.error = 'Unable to load audit logs.'; this.cdr.markForCheck(); }
      });
  }

  getActionClass(action: string): string {
    return `action--${action.toLowerCase()}`;
  }
}
