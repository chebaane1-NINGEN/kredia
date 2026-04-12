import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  standalone: true,
  templateUrl: './transaction-page.component.html',
  styleUrl: './transaction-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionPageComponent {}
