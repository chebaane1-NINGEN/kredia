import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  standalone: true,
  templateUrl: './transaction-audit-log-page.component.html',
  styleUrl: './transaction-audit-log-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionAuditLogPageComponent {}
