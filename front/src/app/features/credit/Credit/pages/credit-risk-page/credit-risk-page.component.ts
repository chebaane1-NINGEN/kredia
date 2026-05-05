import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { CreditVm } from '../../vm/credit.vm';
import { DefaultPredictionResponse } from '../../models/credit.model';

@Component({
  standalone: false,
  templateUrl: './credit-risk-page.component.html',
  styleUrl: './credit-risk-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreditRiskPageComponent implements OnInit {
  private readonly vm    = inject(CreditVm);
  private readonly cdr   = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);

  creditId: number | null = null;
  loading = false;
  error: string | null = null;
  result: DefaultPredictionResponse | null = null;

  ngOnInit(): void {
    // If ?creditId= is in the URL, auto-run the prediction immediately
    this.route.queryParamMap.subscribe(params => {
      const param = params.get('creditId');
      if (param) {
        this.creditId = +param;
        this.predict();
      }
    });
  }

  predict(): void {
    if (!this.creditId) {
      this.error = 'Please enter a credit ID.';
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
            : (err.error?.message ?? 'Prediction error. Please check that the ML microservice is running.');
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

  getProbabilityColor(): string {
    if (!this.result) return '#ccc';
    const p = this.result.default_probability;
    if (p < 0.35) return '#00c070';
    if (p < 0.55) return '#f59e0b';
    return '#ef4444';
  }

  getGaugeColor(): string {
    if (!this.result) return '#e5e7eb';
    const level = this.result.risk_level?.toUpperCase();
    if (level === 'LOW')    return '#16a34a';
    if (level === 'MEDIUM') return '#f59e0b';
    return '#ef4444'; // HIGH / CRITICAL
  }

  /**
   * SVG circle circumference = 2 * π * r = 2 * π * 50 ≈ 314.16
   * stroke-dasharray = "filled gap" where filled = circumference * probability
   */
  getGaugeDash(): string {
    if (!this.result) return '0 314.16';
    const circumference = 2 * Math.PI * 50;
    const filled = circumference * this.result.default_probability;
    return `${filled.toFixed(2)} ${(circumference - filled).toFixed(2)}`;
  }

  getRiskLabelClass(): string {
    const level = this.result?.risk_level;
    return level ? `risk-badge--${level.toLowerCase()}` : '';
  }

  getRiskScoreLabel(label: string | undefined): string {
    if (!label) return '—';
    const map: Record<string, string> = {
      'RISQUE_FAIBLE':   'Low Risk',
      'RISQUE_MOYEN':    'Medium Risk',
      'RISQUE_ELEVE':    'High Risk',
      'RISQUE_ÉLEVÉ':    'High Risk',
      'RISQUE_CRITIQUE': 'Critical Risk',
      'LOW_RISK':        'Low Risk',
      'MEDIUM_RISK':     'Medium Risk',
      'HIGH_RISK':       'High Risk',
      'CRITICAL_RISK':   'Critical Risk',
    };
    return map[label.toUpperCase()] ?? label;
  }

  translateRecommendation(rec: string | undefined): string {
    if (!rec) return '—';
    const t = rec.trim().toLowerCase();
    if (t.includes('approuvable') && t.includes('sain'))
      return 'Approvable credit. Healthy financial profile.';
    if (t.includes('surveillance') && (t.includes('revenus') || t.includes('charges')))
      return 'Monitoring recommended. Verify income and expenses.';
    if (t.includes('approuvable') && t.includes('surveillance'))
      return 'Approvable credit with monitoring.';
    if (t.includes('risqué') && t.includes('approfondie'))
      return 'Risky credit. In-depth analysis recommended.';
    if (t.includes('très risqué') || (t.includes('risqué') && t.includes('refus')))
      return 'Very risky credit. Rejection recommended.';
    if (t.includes('risque élevé') || t.includes('risque eleve') || t.includes('fortement'))
      return 'High-risk profile. Rejection strongly recommended.';
    return rec; // already English or unknown
  }
}
