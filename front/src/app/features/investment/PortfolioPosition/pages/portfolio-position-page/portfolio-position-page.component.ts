import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioPosition } from '../../models/portfolio-position.model';
import { PortfolioPositionVm } from '../../vm/portfolio-position.vm';

@Component({
  selector: 'app-portfolio-position-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './portfolio-position-page.component.html',
  styleUrl: './portfolio-position-page.component.scss'
})
export class PortfolioPositionPageComponent implements OnInit {
  private readonly vm = inject(PortfolioPositionVm);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  deletingPositionId: number | null = null;
  errorMessage = '';

  positions: PortfolioPosition[] = [];
  searchTerm = '';
  performanceFilter: 'ALL' | 'PROFITABLE' | 'LOSING' | 'NEUTRAL' = 'ALL';
  sortBy:
    | 'created-desc'
    | 'created-asc'
    | 'asset-asc'
    | 'asset-desc'
    | 'value-desc'
    | 'value-asc'
    | 'pnl-desc'
    | 'pnl-asc' = 'created-desc';
  displayCount = 10;

  readonly performanceFilterOptions: Array<'ALL' | 'PROFITABLE' | 'LOSING' | 'NEUTRAL'> = [
    'ALL',
    'PROFITABLE',
    'LOSING',
    'NEUTRAL'
  ];

  readonly sortOptions: Array<{
    value:
      | 'created-desc'
      | 'created-asc'
      | 'asset-asc'
      | 'asset-desc'
      | 'value-desc'
      | 'value-asc'
      | 'pnl-desc'
      | 'pnl-asc';
    label: string;
  }> = [
    { value: 'created-desc', label: 'Newest first' },
    { value: 'created-asc', label: 'Oldest first' },
    { value: 'asset-asc', label: 'Asset A → Z' },
    { value: 'asset-desc', label: 'Asset Z → A' },
    { value: 'value-desc', label: 'Value high → low' },
    { value: 'value-asc', label: 'Value low → high' },
    { value: 'pnl-desc', label: 'P/L high → low' },
    { value: 'pnl-asc', label: 'P/L low → high' }
  ];

  ngOnInit(): void {
    this.loadPositions();
  }

  get visiblePositions(): PortfolioPosition[] {
    return this.filteredPositions.slice(0, this.displayCount);
  }

  get filteredPositions(): PortfolioPosition[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.positions
      .filter((position) => {
        const profitLoss = position.profitLossDollars ?? 0;
        const matchesSearch =
          !term ||
          position.assetSymbol.toLowerCase().includes(term) ||
          String(position.positionId).includes(term) ||
          String(position.userId).includes(term);

        const matchesPerformance =
          this.performanceFilter === 'ALL' ||
          (this.performanceFilter === 'PROFITABLE' && profitLoss > 0) ||
          (this.performanceFilter === 'LOSING' && profitLoss < 0) ||
          (this.performanceFilter === 'NEUTRAL' && profitLoss === 0);

        return matchesSearch && matchesPerformance;
      })
      .sort((leftPosition, rightPosition) => this.comparePositions(leftPosition, rightPosition));
  }

  get totalPortfolioValue(): number {
    return this.positions.reduce((sum, position) => sum + (position.currentValue ?? 0), 0);
  }

  get totalProfitLoss(): number {
    return this.positions.reduce((sum, position) => sum + (position.profitLossDollars ?? 0), 0);
  }

  get profitablePositionsCount(): number {
    return this.positions.filter((position) => (position.profitLossDollars ?? 0) > 0).length;
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.searchTerm = input?.value ?? '';
    this.displayCount = 10;
  }

  onPerformanceFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement | null;
    this.performanceFilter = (select?.value ?? 'ALL') as 'ALL' | 'PROFITABLE' | 'LOSING' | 'NEUTRAL';
    this.displayCount = 10;
  }

  onSortChange(event: Event): void {
    const select = event.target as HTMLSelectElement | null;
    this.sortBy = (select?.value ?? 'created-desc') as
      | 'created-desc'
      | 'created-asc'
      | 'asset-asc'
      | 'asset-desc'
      | 'value-desc'
      | 'value-asc'
      | 'pnl-desc'
      | 'pnl-asc';
    this.displayCount = 10;
  }

  loadPositions(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.vm.findAll().subscribe({
      next: (positions) => {
        this.positions = positions;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Unable to load portfolio positions.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadMore(): void {
    this.displayCount += 10;
  }

  closePosition(positionId: number): void {
    const confirmed = window.confirm('Are you sure you want to close this position?');
    if (!confirmed) {
      return;
    }

    this.deletingPositionId = positionId;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.vm.delete(positionId).subscribe({
      next: () => {
        this.positions = this.positions.filter((position) => position.positionId !== positionId);
        this.deletingPositionId = null;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Unable to close this position.';
        this.deletingPositionId = null;
        this.cdr.detectChanges();
      }
    });
  }

  profitLossClass(value: number): string {
    if (value > 0) {
      return 'text-positive';
    }

    if (value < 0) {
      return 'text-negative';
    }

    return '';
  }

  private comparePositions(leftPosition: PortfolioPosition, rightPosition: PortfolioPosition): number {
    switch (this.sortBy) {
      case 'created-asc':
        return this.compareDates(leftPosition.createdAt, rightPosition.createdAt);
      case 'asset-asc':
        return leftPosition.assetSymbol.localeCompare(rightPosition.assetSymbol);
      case 'asset-desc':
        return rightPosition.assetSymbol.localeCompare(leftPosition.assetSymbol);
      case 'value-asc':
        return this.compareNumbers(leftPosition.currentValue, rightPosition.currentValue);
      case 'value-desc':
        return this.compareNumbers(rightPosition.currentValue, leftPosition.currentValue);
      case 'pnl-asc':
        return this.compareNumbers(leftPosition.profitLossDollars, rightPosition.profitLossDollars);
      case 'pnl-desc':
        return this.compareNumbers(rightPosition.profitLossDollars, leftPosition.profitLossDollars);
      case 'created-desc':
      default:
        return this.compareDates(rightPosition.createdAt, leftPosition.createdAt);
    }
  }

  private compareNumbers(leftValue?: number | null, rightValue?: number | null): number {
    const left = leftValue ?? 0;
    const right = rightValue ?? 0;

    return left - right;
  }

  private compareDates(leftValue?: string, rightValue?: string): number {
    const left = leftValue ? new Date(leftValue).getTime() : 0;
    const right = rightValue ? new Date(rightValue).getTime() : 0;

    return left - right;
  }
}
