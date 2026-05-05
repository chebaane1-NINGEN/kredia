import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../../core/services/auth.service';
import { InvestmentStrategy, StrategyRiskProfile } from '../../models/investment-strategy.model';
import { InvestmentStrategyVm } from '../../vm/investment-strategy.vm';
import { StrategyCreationResponseDTO } from '../../data-access/investment-strategy.api';
import { PortfolioPosition } from '../../../PortfolioPosition/models/portfolio-position.model';
import { PortfolioPositionVm } from '../../../PortfolioPosition/vm/portfolio-position.vm';

@Component({
  selector: 'app-investment-strategy-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './investment-strategy-page.component.html',
  styleUrl: './investment-strategy-page.component.scss'
})
export class InvestmentStrategyPageComponent implements OnInit {
  private readonly vm = inject(InvestmentStrategyVm);
  private readonly positionVm = inject(PortfolioPositionVm);
  private readonly auth = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  saveLoading = false;
  deleteLoadingId: number | null = null;
  errorMessage = '';
  actionMessage = '';

  strategies: InvestmentStrategy[] = [];

  searchTerm = '';
  riskFilter = 'ALL';

  readonly riskOptions: Array<'ALL' | StrategyRiskProfile> = ['ALL', 'LOW', 'MEDIUM', 'HIGH'];

  isEditMode = false;
  editStrategyId: number | null = null;

  formModel = this.getDefaultFormModel();

  // Modal state
  modalOpen = false;
  selectedStrategy: InvestmentStrategy | null = null;
  modalPositions: PortfolioPosition[] = [];
  modalPositionsLoading = false;
  modalError = '';

  // Form modal state
  formModalOpen = false;
  formModalTitle = 'Create strategy';

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
        this.errorMessage = 'Unable to load strategies right now.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  submitStrategyForm(): void {
    const userId = this.auth.getCurrentUserId();
    if (!userId) {
      this.errorMessage = 'User not authenticated. Unable to save the strategy.';
      this.cdr.detectChanges();
      return;
    }

    const strategyName = this.formModel.strategyName.trim();
    if (!strategyName) {
      this.errorMessage = 'The strategy name is required.';
      this.cdr.detectChanges();
      return;
    }

    const payload: InvestmentStrategy = {
      strategyName,
      maxBudget: this.parseNullableNumber(this.formModel.maxBudget),
      stopLossPct: this.parseNullableNumber(this.formModel.stopLossPct),
      riskProfile: this.formModel.riskProfile,
      autoCreateOrders: this.formModel.autoCreateOrders,
      autoCreatePositions: this.formModel.autoCreatePositions,
      maxAssets: this.parsePositiveInt(this.formModel.maxAssets, 5),
      reinvestProfits: this.formModel.reinvestProfits,
      isActive: this.formModel.isActive,
      user: { userId }
    };

    this.saveLoading = true;
    this.errorMessage = '';
    this.actionMessage = '';
    this.cdr.markForCheck();

    if (this.isEditMode && this.editStrategyId) {
      this.vm.update(this.editStrategyId, payload).subscribe({
        next: () => {
          this.saveLoading = false;
          this.closeFormModal();
          this.actionMessage = 'Strategy updated successfully.';
          this.loadStrategies();
          this.cdr.detectChanges();
        },
        error: () => {
          this.saveLoading = false;
          this.errorMessage = 'Unable to update the strategy.';
          this.cdr.detectChanges();
        }
      });

      return;
    }

    this.vm.create(payload).subscribe({
      next: (response: StrategyCreationResponseDTO) => {
        this.saveLoading = false;
        this.closeFormModal();
        // Afficher le message du backend qui contient les détails (positions créées, etc.)
        this.actionMessage = response.message || 'Strategy created successfully.';
        console.log('[DEBUG] Strategy creation response:', response);
        this.loadStrategies();
        this.cdr.detectChanges();
      },
      error: () => {
        this.saveLoading = false;
        this.errorMessage = 'Unable to create the strategy.';
        this.cdr.detectChanges();
      }
    });
  }

  editStrategy(strategy: InvestmentStrategy): void {
    this.isEditMode = true;
    this.editStrategyId = strategy.strategyId ?? null;
    this.errorMessage = '';
    this.actionMessage = '';

    this.formModel = {
      strategyName: strategy.strategyName,
      maxBudget: strategy.maxBudget != null ? String(strategy.maxBudget) : '',
      stopLossPct: strategy.stopLossPct != null ? String(strategy.stopLossPct) : '',
      riskProfile: strategy.riskProfile,
      autoCreateOrders: strategy.autoCreateOrders,
      autoCreatePositions: strategy.autoCreatePositions,
      maxAssets: String(strategy.maxAssets ?? 5),
      reinvestProfits: strategy.reinvestProfits,
      isActive: strategy.isActive
    };

    this.cdr.detectChanges();
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.editStrategyId = null;
    this.formModel = this.getDefaultFormModel();
    this.cdr.detectChanges();
  }

  deleteStrategy(strategy: InvestmentStrategy): void {
    if (!strategy.strategyId) {
      return;
    }

    const confirmed = window.confirm(`Delete strategy \"${strategy.strategyName}\"?`);
    if (!confirmed) {
      return;
    }

    this.deleteLoadingId = strategy.strategyId;
    this.errorMessage = '';
    this.actionMessage = '';

    this.vm.delete(strategy.strategyId).subscribe({
      next: () => {
        this.deleteLoadingId = null;
        this.actionMessage = 'Strategy deleted successfully.';
        if (this.selectedStrategy?.strategyId === strategy.strategyId) {
          this.closeStrategyModal();
        }
        this.loadStrategies();
      },
      error: () => {
        this.deleteLoadingId = null;
        this.errorMessage = 'Unable to delete the strategy right now.';
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

  getStopLossColor(stopLossPct: number | null | undefined): string {
    const pct = typeof stopLossPct === 'number' && Number.isFinite(stopLossPct) ? stopLossPct : 0;

    const clamp = (v: number, a = 0, b = 100) => Math.max(a, Math.min(b, v));
    const toHex = (r: number, g: number, b: number) =>
      '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');

    const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);

    // Colors
    const green = { r: 16, g: 185, b: 129 }; // #10b981 (emerald-500)
    const yellow = { r: 234, g: 179, b: 8 }; // #eab308
    const red = { r: 229, g: 62, b: 62 }; // #e53e3e

    // Rules: 0-20 => green; 60-100 => red; between 20-60 => interpolate green -> yellow -> red
    const p = clamp(pct, 0, 100);
    if (p <= 20) {
      return `linear-gradient(120deg, ${toHex(green.r, green.g, green.b)}, ${toHex(green.r, green.g, green.b)})`;
    }
    if (p >= 60) {
      return `linear-gradient(120deg, ${toHex(red.r, red.g, red.b)}, ${toHex(red.r, red.g, red.b)})`;
    }

    // interpolate between green->yellow for 20-40, yellow->red for 40-60
    const tNorm = (p - 20) / 40; // 0..1 across 20..60
    let colorStart = green;
    let colorEnd = yellow;
    let localT = tNorm;
    if (tNorm > 0.5) {
      // second half: yellow -> red
      localT = (tNorm - 0.5) * 2; // 0..1
      colorStart = yellow;
      colorEnd = red;
    } else {
      localT = tNorm * 2; // 0..1 for green->yellow
    }

    const r = lerp(colorStart.r, colorEnd.r, localT);
    const g = lerp(colorStart.g, colorEnd.g, localT);
    const b = lerp(colorStart.b, colorEnd.b, localT);

    const hex = toHex(r, g, b);
    return `linear-gradient(120deg, ${hex}, ${hex})`;
  }

  private parseNullableNumber(rawValue: string | number | null | undefined): number | null {
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return null;
    }

    const numericValue = typeof rawValue === 'number' ? rawValue : Number(rawValue);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  private parsePositiveInt(rawValue: string | number | null | undefined, fallback: number): number {
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return fallback;
    }

    const parsed = typeof rawValue === 'number' ? Math.trunc(rawValue) : parseInt(rawValue, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }

    return parsed;
  }

  private getDefaultFormModel(): {
    strategyName: string;
    maxBudget: string;
    stopLossPct: string;
    riskProfile: StrategyRiskProfile;
    autoCreateOrders: boolean;
    autoCreatePositions: boolean;
    maxAssets: string;
    reinvestProfits: boolean;
    isActive: boolean;
  } {
    return {
      strategyName: '',
      maxBudget: '',
      stopLossPct: '',
      riskProfile: 'MEDIUM',
      autoCreateOrders: false,
      autoCreatePositions: true,
      maxAssets: '5',
      reinvestProfits: false,
      isActive: true
    };
  }

  openStrategyModal(strategy: InvestmentStrategy): void {
    this.selectedStrategy = strategy;
    this.modalOpen = true;
    this.modalError = '';
    this.modalPositions = [];
    this.modalPositionsLoading = true;
    this.cdr.detectChanges();

    queueMicrotask(() => {
      this.loadStrategyPositions(strategy.strategyId ?? 0);
    });
  }

  closeStrategyModal(): void {
    this.modalOpen = false;
    this.selectedStrategy = null;
    this.modalPositions = [];
    this.modalError = '';
    this.cdr.detectChanges();
  }

  loadStrategyPositions(strategyId: number): void {
    if (!strategyId) {
      return;
    }

    this.modalPositionsLoading = true;
    this.modalError = '';
    this.cdr.markForCheck();

    this.positionVm.findByStrategy(strategyId).subscribe({
      next: (positions) => {
        this.modalPositions = positions;
        this.modalPositionsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.modalPositionsLoading = false;
        this.modalError = 'Unable to load the positions for this strategy.';
        this.cdr.detectChanges();
      }
    });
  }

  getPositionProfitClass(position: PortfolioPosition): string {
    const profitLoss = position.profitLossPercentage ?? 0;
    if (profitLoss > 0) {
      return 'text-positive';
    } else if (profitLoss < 0) {
      return 'text-negative';
    }
    return '';
  }

  getPositionCurrentValue(position: PortfolioPosition): number {
    return position.currentValue ?? (position.currentQuantity * (position.currentMarketPrice ?? position.avgPurchasePrice));
  }

  openFormModal(): void {
    this.isEditMode = false;
    this.editStrategyId = null;
    this.formModel = this.getDefaultFormModel();
    this.formModalOpen = true;
    this.formModalTitle = 'Create strategy';
    this.errorMessage = '';
    this.actionMessage = '';
    this.cdr.detectChanges();
  }

  openEditFormModal(strategy: InvestmentStrategy): void {
    this.isEditMode = true;
    this.editStrategyId = strategy.strategyId ?? null;
    this.formModalTitle = `Modifier: ${strategy.strategyName}`;
    this.errorMessage = '';
    this.actionMessage = '';

    this.formModel = {
      strategyName: strategy.strategyName,
      maxBudget: strategy.maxBudget != null ? String(strategy.maxBudget) : '',
      stopLossPct: strategy.stopLossPct != null ? String(strategy.stopLossPct) : '',
      riskProfile: strategy.riskProfile,
      autoCreateOrders: strategy.autoCreateOrders,
      autoCreatePositions: strategy.autoCreatePositions,
      maxAssets: String(strategy.maxAssets ?? 5),
      reinvestProfits: strategy.reinvestProfits,
      isActive: strategy.isActive
    };

    this.formModalOpen = true;
    this.cdr.detectChanges();
  }

  closeFormModal(): void {
    this.formModalOpen = false;
    this.isEditMode = false;
    this.editStrategyId = null;
    this.formModel = this.getDefaultFormModel();
    this.errorMessage = '';
    this.actionMessage = '';
    this.cdr.detectChanges();
  }
}
