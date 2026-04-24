import { Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { CreditApi } from '../data-access/credit.api';
import { DefaultPredictionResponse } from '../models/credit.model';

@Injectable()
export class CreditRiskVm {
  private readonly api = inject(CreditApi);

  // ── State ──────────────────────────────────────────────
  readonly creditId = signal<number | null>(null);
  readonly loading  = signal(false);
  readonly error    = signal<string | null>(null);
  readonly result   = signal<DefaultPredictionResponse | null>(null);

  // ── Actions ────────────────────────────────────────────
  predict(): void {
    const id = this.creditId();
    if (!id) {
      this.error.set('Please enter a credit ID.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);

    this.api.predictDefault(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next:  (res) => this.result.set(res),
        error: (err) => this.error.set(
          typeof err.error === 'string'
            ? err.error
            : (err.error?.message ?? 'Error during prediction. Check that the ML microservice is active.')
        )
      });
  }

  reset(): void {
    this.creditId.set(null);
    this.result.set(null);
    this.error.set(null);
  }

  // ── Presentation helpers ───────────────────────────────
  getProbabilityColor(): string {
    const prob = this.result()?.default_probability;
    if (prob === undefined) return '#ccc';
    if (prob < 0.35) return '#00c070';
    if (prob < 0.55) return '#f59e0b';
    return '#ef4444';
  }

  getRiskLabelClass(): string {
    const level = this.result()?.risk_level;
    return level ? `risk-badge--${level.toLowerCase()}` : '';
  }
}
