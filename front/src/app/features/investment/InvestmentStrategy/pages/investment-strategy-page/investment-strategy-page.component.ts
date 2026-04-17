import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { InvestmentStrategyVm } from '../../vm/investment-strategy.vm';
import { InvestmentStrategy } from '../../models/investment-strategy.model';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './investment-strategy-page.component.html',
  styleUrl: './investment-strategy-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvestmentStrategyPageComponent implements OnInit {
  private readonly vm  = inject(InvestmentStrategyVm);
  private readonly cdr = inject(ChangeDetectorRef);

  strategies: InvestmentStrategy[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadStrategies();
  }

  loadStrategies(): void {
    this.loading = true;
    this.error   = null;
    this.cdr.markForCheck();

    this.vm.findAll()
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next:  (data) => { this.strategies = data ?? []; this.cdr.markForCheck(); },
        error: ()     => { this.error = 'Unable to load investment strategies.'; this.cdr.markForCheck(); }
      });
  }

  getRiskClass(riskLevel: string): string {
    return `risk--${riskLevel.toLowerCase()}`;
  }
}
