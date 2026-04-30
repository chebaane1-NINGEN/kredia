import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvestmentStrategy } from '../../models/investment-strategy.model';
import { InvestmentStrategyVm } from '../../vm/investment-strategy.vm';

@Component({
  selector: 'app-investment-strategy-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './investment-strategy-page.component.html',
  styleUrl: './investment-strategy-page.component.scss'
})
export class InvestmentStrategyPageComponent implements OnInit {
  private readonly vm = inject(InvestmentStrategyVm);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  errorMessage = '';

  strategies: InvestmentStrategy[] = [];

  searchTerm = '';
  riskFilter = 'ALL';

  readonly riskOptions = ['ALL', 'LOW', 'MEDIUM', 'HIGH'];

  ngOnInit(): void {
    this.loadStrategies();
  }

  get filteredStrategies(): InvestmentStrategy[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.strategies.filter((strategy) => {
      const matchesSearch =
        !term ||
        strategy.strategyName.toLowerCase().includes(term);

      const normalizedRisk = strategy.riskProfile.toUpperCase();
      const matchesRisk = this.riskFilter === 'ALL' || normalizedRisk === this.riskFilter;

      return matchesSearch && matchesRisk;
    });
  }

  get averageBudget(): number {
    if (this.strategies.length === 0) {
      return 0;
    }

    const total = this.strategies.reduce((sum, strategy) => sum + (strategy.maxBudget ?? 0), 0);
    return total / this.strategies.length;
  }

  get highRiskCount(): number {
    return this.strategies.filter((strategy) => strategy.riskProfile.toUpperCase() === 'HIGH').length;
  }

  get activeStrategiesCount(): number {
    return this.strategies.filter((strategy) => strategy.isActive).length;
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.searchTerm = input?.value ?? '';
  }

  onRiskFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement | null;
    this.riskFilter = select?.value ?? 'ALL';
  }

  loadStrategies(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.vm.findAll().subscribe({
      next: (strategies) => {
        this.strategies = strategies;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les stratégies pour le moment.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getRiskBadgeClass(riskProfile: string): string {
    const normalizedRisk = riskProfile.toUpperCase();

    switch (normalizedRisk) {
      case 'LOW':
        return 'badge badge--low';
      case 'MEDIUM':
        return 'badge badge--medium';
      case 'HIGH':
        return 'badge badge--high';
      default:
        return 'badge';
    }
  }

  stopLossPercent(stopLossPct: number | null | undefined): number {
    if (!stopLossPct || stopLossPct <= 0) {
      return 0;
    }

    if (stopLossPct >= 100) {
      return 100;
    }

    return stopLossPct;
  }
}
