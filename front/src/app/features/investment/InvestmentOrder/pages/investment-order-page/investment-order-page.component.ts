import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { InvestmentOrderVm } from '../../vm/investment-order.vm';
import { InvestmentOrder } from '../../models/investment-order.model';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './investment-order-page.component.html',
  styleUrl: './investment-order-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvestmentOrderPageComponent implements OnInit {
  private readonly vm  = inject(InvestmentOrderVm);
  private readonly cdr = inject(ChangeDetectorRef);

  orders: InvestmentOrder[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.error   = null;
    this.cdr.markForCheck();

    this.vm.findAll()
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next:  (data) => { this.orders = data ?? []; this.cdr.markForCheck(); },
        error: ()     => { this.error = 'Unable to load investment orders.'; this.cdr.markForCheck(); }
      });
  }

  cancel(id: number): void {
    this.vm.cancel(id).subscribe({
      next: (updated) => {
        this.orders = this.orders.map(o => o.orderId === id ? updated : o);
        this.cdr.markForCheck();
      },
      error: () => { this.error = `Failed to cancel order #${id}.`; this.cdr.markForCheck(); }
    });
  }

  getStatusClass(status: string): string {
    return `status--${status.toLowerCase()}`;
  }

  getTypeClass(type: string): string {
    return `type--${type.toLowerCase()}`;
  }
}
