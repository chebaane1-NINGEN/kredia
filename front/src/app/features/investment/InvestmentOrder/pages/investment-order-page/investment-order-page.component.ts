import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvestmentOrder, OrderStatus, OrderType } from '../../models/investment-order.model';
import { InvestmentOrderVm } from '../../vm/investment-order.vm';

@Component({
  selector: 'app-investment-order-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './investment-order-page.component.html',
  styleUrl: './investment-order-page.component.scss'
})
export class InvestmentOrderPageComponent implements OnInit {
  private readonly vm = inject(InvestmentOrderVm);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  errorMessage = '';
  cancelInProgressOrderId: number | null = null;

  orders: InvestmentOrder[] = [];

  searchTerm = '';
  statusFilter: 'ALL' | OrderStatus = 'ALL';
  typeFilter: 'ALL' | OrderType = 'ALL';

  readonly statusOptions: Array<'ALL' | OrderStatus> = ['ALL', 'PENDING', 'EXECUTED', 'CANCELLED', 'PARTIALLY_FILLED'];
  readonly typeOptions: Array<'ALL' | OrderType> = ['ALL', 'BUY', 'SELL'];

  ngOnInit(): void {
    this.loadOrders();
  }

  get filteredOrders(): InvestmentOrder[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.orders
      .filter((order) => {
        const userId = order.user?.userId ?? order.user?.id ?? '';

        const matchesSearch =
          !term ||
          String(order.orderId ?? '').includes(term) ||
          String(userId).includes(term) ||
          order.assetSymbol.toLowerCase().includes(term);

        const matchesStatus = this.statusFilter === 'ALL' || order.orderStatus === this.statusFilter;
        const matchesType = this.typeFilter === 'ALL' || order.orderType === this.typeFilter;

        return matchesSearch && matchesStatus && matchesType;
      })
      .sort(
        (leftOrder, rightOrder) =>
          this.getOrderSortWeight(leftOrder.orderStatus) - this.getOrderSortWeight(rightOrder.orderStatus)
      );
  }

  get pendingCount(): number {
    return this.orders.filter((order) => order.orderStatus === 'PENDING').length;
  }

  get executedCount(): number {
    return this.orders.filter((order) => order.orderStatus === 'EXECUTED').length;
  }

  get cancelledCount(): number {
    return this.orders.filter((order) => order.orderStatus === 'CANCELLED').length;
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.searchTerm = input?.value ?? '';
  }

  onStatusFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement | null;
    this.statusFilter = (select?.value ?? 'ALL') as 'ALL' | OrderStatus;
  }

  onTypeFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement | null;
    this.typeFilter = (select?.value ?? 'ALL') as 'ALL' | OrderType;
  }

  loadOrders(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.vm.findAll().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les ordres pour le moment.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cancelOrder(order: InvestmentOrder): void {
    if (order.orderStatus !== 'PENDING' || !order.orderId) {
      return;
    }

    const confirmed = window.confirm('Confirmer l\'annulation de cet ordre ?');
    if (!confirmed) {
      return;
    }

    this.cancelInProgressOrderId = order.orderId;

    this.vm.cancel(order).subscribe({
      next: (updatedOrder) => {
        this.orders = this.orders.map((current) =>
          current.orderId === updatedOrder.orderId ? updatedOrder : current
        );
        this.cancelInProgressOrderId = null;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cancelInProgressOrderId = null;
        this.errorMessage = 'Annulation impossible pour le moment.';
        this.cdr.detectChanges();
      }
    });
  }

  getStatusBadgeClass(status: OrderStatus): string {
    switch (status) {
      case 'PENDING':
        return 'badge badge--pending';
      case 'EXECUTED':
        return 'badge badge--executed';
      case 'CANCELLED':
        return 'badge badge--cancelled';
      case 'PARTIALLY_FILLED':
        return 'badge badge--medium';
      default:
        return 'badge';
    }
  }

  getTypeBadgeClass(type: OrderType): string {
    switch (type) {
      case 'BUY':
        return 'badge badge--buy';
      case 'SELL':
        return 'badge badge--sell';
      default:
        return 'badge';
    }
  }

  private getOrderSortWeight(status: OrderStatus): number {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'PARTIALLY_FILLED':
        return 1;
      case 'EXECUTED':
        return 2;
      case 'CANCELLED':
        return 3;
      default:
        return 4;
    }
  }
}
