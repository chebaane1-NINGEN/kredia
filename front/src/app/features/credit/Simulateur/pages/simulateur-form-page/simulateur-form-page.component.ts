import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';
import { RepaymentType } from '../../../Credit/models/credit.model';

/* ── Amortization row model ──────────────────────────────── */
export interface AmortizationRow {
  month:      number;
  startBalance: number;
  payment:    number;
  interest:   number;
  principal:  number;
  endBalance: number;
}

/* ── Summary KPIs ────────────────────────────────────────── */
export interface SimulationSummary {
  totalPaid:      number;
  totalInterest:  number;
  totalPrincipal: number;
  firstPayment:   number;
  lastPayment:    number;
}

const ANNUAL_RATE = 0.15; // 15 % fixed

@Component({
  standalone: false,
  templateUrl: './simulateur-form-page.component.html',
  styleUrl:    './simulateur-form-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimulateurFormPageComponent implements OnInit {
  private readonly route  = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb     = inject(FormBuilder);
  private readonly cdr    = inject(ChangeDetectorRef);

  /* ── Selected type ──────────────────────────────────────── */
  repaymentType!: RepaymentType;

  readonly typeLabels: Record<RepaymentType, string> = {
    MENSUALITE_CONSTANTE:   'Mensualité Constante',
    AMORTISSEMENT_CONSTANT: 'Amortissement Constant',
    IN_FINE:                'In Fine',
  };

  readonly typeIcons: Record<RepaymentType, string> = {
    MENSUALITE_CONSTANTE:   '📅',
    AMORTISSEMENT_CONSTANT: '📉',
    IN_FINE:                '🏦',
  };

  readonly typeDescriptions: Record<RepaymentType, string> = {
    MENSUALITE_CONSTANTE:   'Paiement identique chaque mois — capital & intérêts.',
    AMORTISSEMENT_CONSTANT: 'Capital fixe remboursé chaque mois — mensualités décroissantes.',
    IN_FINE:                'Intérêts seuls chaque mois — capital remboursé à la dernière échéance.',
  };

  /* ── Form ───────────────────────────────────────────────── */
  readonly form = this.fb.nonNullable.group({
    amount:     [10000,  [Validators.required, Validators.min(100)]],
    termMonths: [12,     [Validators.required, Validators.min(1), Validators.max(360)]],
    startDate:  [this.todayStr(), Validators.required],
  });

  /* ── Results ────────────────────────────────────────────── */
  schedule: AmortizationRow[]     = [];
  summary:  SimulationSummary | null = null;
  simulated = false;

  /* ── Pagination ─────────────────────────────────────────── */
  pageSize    = 12;
  currentPage = 0;

  get totalPages(): number {
    return Math.ceil(this.schedule.length / this.pageSize);
  }

  get visibleRows(): AmortizationRow[] {
    const start = this.currentPage * this.pageSize;
    return this.schedule.slice(start, start + this.pageSize);
  }

  /* ─────────────────────────────────────────────────────────
     Lifecycle
  ───────────────────────────────────────────────────────── */
  ngOnInit(): void {
    const param = this.route.snapshot.paramMap.get('type') as RepaymentType;
    const valid: RepaymentType[] = [
      'MENSUALITE_CONSTANTE',
      'AMORTISSEMENT_CONSTANT',
      'IN_FINE',
    ];

    if (!valid.includes(param)) {
      this.router.navigate(['/credit/simulateur']);
      return;
    }

    this.repaymentType = param;
  }

  /* ─────────────────────────────────────────────────────────
     Calculation engine
  ───────────────────────────────────────────────────────── */
  simulate(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    const { amount, termMonths } = this.form.getRawValue();
    const monthlyRate = ANNUAL_RATE / 12;

    switch (this.repaymentType) {
      case 'MENSUALITE_CONSTANTE':
        this.schedule = this.calcMensualiteConstante(amount, termMonths, monthlyRate);
        break;
      case 'AMORTISSEMENT_CONSTANT':
        this.schedule = this.calcAmortissementConstant(amount, termMonths, monthlyRate);
        break;
      case 'IN_FINE':
        this.schedule = this.calcInFine(amount, termMonths, monthlyRate);
        break;
    }

    this.summary      = this.buildSummary(this.schedule);
    this.simulated    = true;
    this.currentPage  = 0;
    this.cdr.markForCheck();

    // Scroll to results
    setTimeout(() => {
      document.getElementById('sim-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  reset(): void {
    this.form.reset({
      amount:     10000,
      termMonths: 12,
      startDate:  this.todayStr(),
    });
    this.schedule  = [];
    this.summary   = null;
    this.simulated = false;
    this.cdr.markForCheck();
  }

  goBack(): void {
    this.router.navigate(['/credit/simulateur']);
  }

  /* ── Pagination helpers ─────────────────────────────────── */
  prevPage(): void { if (this.currentPage > 0) { this.currentPage--; this.cdr.markForCheck(); } }
  nextPage(): void { if (this.currentPage < this.totalPages - 1) { this.currentPage++; this.cdr.markForCheck(); } }
  goToPage(p: number): void { this.currentPage = p; this.cdr.markForCheck(); }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  /* ─────────────────────────────────────────────────────────
     Amortization algorithms
  ───────────────────────────────────────────────────────── */

  /** Mensualité Constante (French amortization) */
  private calcMensualiteConstante(
    amount: number,
    n: number,
    r: number
  ): AmortizationRow[] {
    // M = P * r*(1+r)^n / ((1+r)^n - 1)
    const payment = amount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const rows: AmortizationRow[] = [];
    let balance = amount;

    for (let m = 1; m <= n; m++) {
      const interest  = balance * r;
      const principal = payment - interest;
      const end       = Math.max(0, balance - principal);
      rows.push({
        month:        m,
        startBalance: balance,
        payment:      payment,
        interest,
        principal,
        endBalance:   m === n ? 0 : end,
      });
      balance = end;
    }
    return rows;
  }

  /** Amortissement Constant */
  private calcAmortissementConstant(
    amount: number,
    n: number,
    r: number
  ): AmortizationRow[] {
    const principal = amount / n;
    const rows: AmortizationRow[] = [];
    let balance = amount;

    for (let m = 1; m <= n; m++) {
      const interest = balance * r;
      const payment  = principal + interest;
      const end      = Math.max(0, balance - principal);
      rows.push({
        month:        m,
        startBalance: balance,
        payment,
        interest,
        principal,
        endBalance:   m === n ? 0 : end,
      });
      balance = end;
    }
    return rows;
  }

  /** In Fine */
  private calcInFine(
    amount: number,
    n: number,
    r: number
  ): AmortizationRow[] {
    const interest = amount * r;
    const rows: AmortizationRow[] = [];

    for (let m = 1; m <= n; m++) {
      const isLast    = m === n;
      const principal = isLast ? amount : 0;
      const payment   = isLast ? interest + amount : interest;
      rows.push({
        month:        m,
        startBalance: amount,
        payment,
        interest,
        principal,
        endBalance:   isLast ? 0 : amount,
      });
    }
    return rows;
  }

  private buildSummary(rows: AmortizationRow[]): SimulationSummary {
    const totalPaid      = rows.reduce((s, r) => s + r.payment,   0);
    const totalInterest  = rows.reduce((s, r) => s + r.interest,  0);
    const totalPrincipal = rows.reduce((s, r) => s + r.principal, 0);
    return {
      totalPaid,
      totalInterest,
      totalPrincipal,
      firstPayment: rows[0]?.payment  ?? 0,
      lastPayment:  rows[rows.length - 1]?.payment ?? 0,
    };
  }

  /* ── Utilities ──────────────────────────────────────────── */
  private todayStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  fmt(n: number): string {
    return n.toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  }

  get annualRate(): number { return ANNUAL_RATE * 100; }
}
