import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { CreditVm } from '../../vm/credit.vm';
import { DefaultPredictionResponse } from '../../models/credit.model';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './credit-risk-page.component.html',
  styleUrl: './credit-risk-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreditRiskPageComponent {
  private readonly vm  = inject(CreditVm);
  private readonly cdr = inject(ChangeDetectorRef);

  // ── État UI ────────────────────────────────────────────
  creditId: number | null = null;
  loading = false;
  error: string | null = null;
  result: DefaultPredictionResponse | null = null;

  // ── Actions ────────────────────────────────────────────
  predict(): void {
    if (!this.creditId) {
      this.error = 'Veuillez saisir un ID de crédit.';
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.error   = null;
    this.result  = null;
    this.cdr.markForCheck();

    this.vm.predictDefault(this.creditId)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next:  (res) => { this.result = res; this.cdr.markForCheck(); },
        error: (err) => {
          this.error = typeof err.error === 'string'
            ? err.error
            : (err.error?.message ?? 'Erreur lors de la prédiction. Vérifiez que le microservice ML est actif.');
          this.cdr.markForCheck();
        }
      });
  }

  reset(): void {
    this.creditId = null;
    this.result   = null;
    this.error    = null;
    this.cdr.markForCheck();
  }

  // ── Helpers de présentation ────────────────────────────
  getProbabilityColor(): string {
    if (!this.result) return '#ccc';
    const p = this.result.default_probability;
    if (p < 0.35) return '#00c070';
    if (p < 0.55) return '#f59e0b';
    return '#ef4444';
  }

  getRiskLabelClass(): string {
    const level = this.result?.risk_level;
    return level ? `risk-badge--${level.toLowerCase()}` : '';
  }
}
