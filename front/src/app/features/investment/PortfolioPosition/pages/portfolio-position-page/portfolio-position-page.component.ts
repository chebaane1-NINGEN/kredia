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
  errorMessage = '';

  positions: PortfolioPosition[] = [];
  searchTerm = '';

  ngOnInit(): void {
    this.loadPositions();
  }

  get filteredPositions(): PortfolioPosition[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.positions.filter((position) => {
      if (!term) {
        return true;
      }

      return (
        position.assetSymbol.toLowerCase().includes(term) ||
        String(position.positionId).includes(term) ||
        String(position.userId).includes(term)
      );
    });
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
        this.errorMessage = 'Impossible de charger les positions du portefeuille.';
        this.loading = false;
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
}
