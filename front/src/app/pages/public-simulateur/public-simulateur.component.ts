import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

const ANNUAL_RATE = 0.15;

@Component({
  selector: 'app-public-simulateur',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './public-simulateur.component.html',
  styleUrl: './public-simulateur.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicSimulateurComponent {
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly auth = inject(AuthService);

  /* ── Sliders state ───────────────────────────────────────── */
  readonly AMOUNT_MIN = 1_000;
  readonly AMOUNT_MAX = 10_000;
  readonly AMOUNT_STEP = 100;

  readonly TERM_MIN = 3;
  readonly TERM_MAX = 120;
  readonly TERM_STEP = 1;

  amount = signal(5_000);
  termMonths = signal(24);
  repaymentType = signal<'MENSUALITE_CONSTANTE' | 'AMORTISSEMENT_CONSTANT' | 'IN_FINE'>('MENSUALITE_CONSTANTE');

  /* ── Computed schedule & KPIs ────────────────────────────── */
  readonly monthlyRate = ANNUAL_RATE / 12;

  schedule = computed(() => {
    const P = this.amount();
    const n = this.termMonths();
    const r = this.monthlyRate;
    const type = this.repaymentType();

    const rows = [];
    let balance = P;

    if (type === 'MENSUALITE_CONSTANTE') {
      const payment = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      for (let m = 1; m <= n; m++) {
        const interest = balance * r;
        const principal = payment - interest;
        balance = Math.max(0, balance - principal);
        rows.push({ payment, interest, principal });
      }
    } else if (type === 'AMORTISSEMENT_CONSTANT') {
      const principal = P / n;
      for (let m = 1; m <= n; m++) {
        const interest = balance * r;
        const payment = principal + interest;
        balance = Math.max(0, balance - principal);
        rows.push({ payment, interest, principal });
      }
    } else if (type === 'IN_FINE') {
      const interest = P * r;
      for (let m = 1; m <= n; m++) {
        const isLast = m === n;
        const principal = isLast ? P : 0;
        const payment = isLast ? interest + P : interest;
        rows.push({ payment, interest, principal });
      }
    }
    return rows;
  });

  totalPaid = computed(() => this.schedule().reduce((acc, row) => acc + row.payment, 0));
  totalInterest = computed(() => this.schedule().reduce((acc, row) => acc + row.interest, 0));
  firstPayment = computed(() => this.schedule()[0]?.payment ?? 0);
  lastPayment = computed(() => this.schedule()[this.schedule().length - 1]?.payment ?? 0);
  monthlyDecrease = computed(() => {
    if (this.repaymentType() === 'AMORTISSEMENT_CONSTANT' && this.schedule().length > 1) {
      return this.schedule()[0].payment - this.schedule()[1].payment;
    }
    return 0;
  });
  decreasePct = computed(() => {
    const first = this.firstPayment();
    if (first > 0) {
      return (this.monthlyDecrease() / first) * 100;
    }
    return 0;
  });

  /* ── Slider track fill % ─────────────────────────────────── */
  amountPct = computed(() =>
    ((this.amount() - this.AMOUNT_MIN) / (this.AMOUNT_MAX - this.AMOUNT_MIN)) * 100
  );

  termPct = computed(() =>
    ((this.termMonths() - this.TERM_MIN) / (this.TERM_MAX - this.TERM_MIN)) * 100
  );

  /* ── Donut chart computed values ─────────────────────────── */
  readonly CIRCUMFERENCE = 301.6; // 2 * π * 48

  capitalPct = computed(() =>
    Math.round((this.amount() / this.totalPaid()) * 100)
  );

  capitalDash = computed(() => {
    const arc = (this.amount() / this.totalPaid() * this.CIRCUMFERENCE).toFixed(1);
    return `${arc} ${this.CIRCUMFERENCE}`;
  });

  interestDash = computed(() => {
    const arc = (this.totalInterest() / this.totalPaid() * this.CIRCUMFERENCE).toFixed(1);
    return `${arc} ${this.CIRCUMFERENCE}`;
  });

  interestOffset = computed(() =>
    this.CIRCUMFERENCE - (this.amount() / this.totalPaid() * this.CIRCUMFERENCE) + 75.4
  );

  /* ── Event handlers ──────────────────────────────────────── */
  onAmountChange(event: Event): void {
    this.amount.set(+(event.target as HTMLInputElement).value);
  }

  onTermChange(event: Event): void {
    this.termMonths.set(+(event.target as HTMLInputElement).value);
  }

  goToLogin(): void {
    if (this.auth.isClient()) {
      this.router.navigate(['/credit/create']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  setType(type: 'MENSUALITE_CONSTANTE' | 'AMORTISSEMENT_CONSTANT' | 'IN_FINE'): void {
    this.repaymentType.set(type);
  }

  /* ── Formatting ──────────────────────────────────────────── */
  fmtAmount(n: number): string {
    return n.toLocaleString('fr-TN', { maximumFractionDigits: 0 });
  }

  fmtMoney(n: number): string {
    return n.toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  }
}
