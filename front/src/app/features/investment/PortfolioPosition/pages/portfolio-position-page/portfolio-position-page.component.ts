import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { PortfolioPositionVm } from '../../vm/portfolio-position.vm';
import { PortfolioPosition } from '../../models/portfolio-position.model';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './portfolio-position-page.component.html',
  styleUrl: './portfolio-position-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PortfolioPositionPageComponent implements OnInit {
  private readonly vm  = inject(PortfolioPositionVm);
  private readonly cdr = inject(ChangeDetectorRef);

  positions: PortfolioPosition[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadPositions();
  }

  loadPositions(): void {
    this.loading = true;
    this.error   = null;
    this.cdr.markForCheck();

    this.vm.findAll()
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next:  (data) => { this.positions = data ?? []; this.cdr.markForCheck(); },
        error: ()     => { this.error = 'Unable to load portfolio positions.'; this.cdr.markForCheck(); }
      });
  }

  getProfitLossClass(profitLoss: number): string {
    if (profitLoss > 0) return 'profit--positive';
    if (profitLoss < 0) return 'profit--negative';
    return 'profit--neutral';
  }
}
