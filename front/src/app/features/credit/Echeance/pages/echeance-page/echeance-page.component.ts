import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EcheanceVm } from '../../vm/echeance.vm';
import { EcheancePaymentResponse } from '../../models/echeance.model';
import { AuthService } from '../../../../../core/services/auth.service';
import { CreditVm } from '../../../Credit/vm/credit.vm';
import { Credit } from '../../../Credit/models/credit.model';

@Component({
  standalone: false,
  templateUrl: './echeance-page.component.html',
  styleUrl: './echeance-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EcheancePageComponent implements OnInit {
  private readonly vm        = inject(EcheanceVm);
  private readonly creditVm  = inject(CreditVm);
  public readonly cdr        = inject(ChangeDetectorRef);
  private readonly route     = inject(ActivatedRoute);
  readonly auth              = inject(AuthService);

  // ── UI State ────────────────────────────────────────────
  loading = false;
  error: string | null = null;

  /** creditId passed as query param — null = no filter */
  filterCreditId: number | null = null;
  /** echeanceId passed as query param — null = no filter */
  filterEcheanceId: number | null = null;

  /** Installments of the selected credit */
  items: EcheancePaymentResponse[] = [];

  /** Active credits of the client (for selection list) */
  clientCredits: Credit[] = [];

  payAmounts: Record<number, number> = {};
  payingId: number | null = null;

  // ── Sort & Filter ─────────────────────────────────────
  dateSortOrder: 'asc' | 'desc' = 'asc';
  statusFilter: string = 'ALL';
  creditFilter: string = 'ALL';
  userFilter:   string = 'ALL';

  get uniqueCreditIds(): number[] {
    const ids = new Set<number>();
    this.items.forEach(i => {
      const cid = (i.echeance as any).creditId;
      if (cid) ids.add(cid);
    });
    return Array.from(ids).sort((a, b) => a - b);
  }

  get uniqueUserIds(): number[] {
    const ids = new Set<number>();
    this.items.forEach(i => {
      const uid = (i.echeance as any).userId;
      if (uid) ids.add(uid);
    });
    return Array.from(ids).sort((a, b) => a - b);
  }

  readonly typeOptions = [
    { value: 'ALL',                     label: 'All Types' },
    { value: 'AMORTISSEMENT_CONSTANT',  label: 'Constant Amort.' },
    { value: 'MENSUALITE_CONSTANTE',    label: 'Constant Monthly' },
    { value: 'IN_FINE',                 label: 'In Fine' },
  ];

  readonly statusOptions = [
    { value: 'ALL',           label: 'All' },
    { value: 'PENDING',       label: 'Pending' },
    { value: 'PAID',          label: 'Paid' },
    { value: 'OVERDUE',       label: 'Overdue' },
    { value: 'PARTIALLY_PAID',label: 'Partial' },
  ];

  get sortedItems(): EcheancePaymentResponse[] {
    let filtered = this.statusFilter === 'ALL'
      ? [...this.items]
      : this.items.filter(i => i.echeance.status === this.statusFilter);

    if (this.creditFilter !== 'ALL') {
      filtered = filtered.filter(i => (i.echeance as any).creditId?.toString() === this.creditFilter);
    }

    if (this.userFilter !== 'ALL') {
      filtered = filtered.filter(i => (i.echeance as any).userId?.toString() === this.userFilter);
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.echeance.dueDate).getTime();
      const dateB = new Date(b.echeance.dueDate).getTime();
      return this.dateSortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }

  setCreditFilter(cid: string): void {
    this.creditFilter = cid;
    this.cdr.markForCheck();
  }

  setUserFilter(uid: string): void {
    this.userFilter = uid;
    this.cdr.markForCheck();
  }

  toggleDateSort(): void {
    this.dateSortOrder = this.dateSortOrder === 'asc' ? 'desc' : 'asc';
    this.cdr.markForCheck();
  }

  setDateSort(order: 'asc' | 'desc'): void {
    this.dateSortOrder = order;
    this.cdr.markForCheck();
  }

  setStatusFilter(status: string): void {
    this.statusFilter = status;
    this.cdr.markForCheck();
  }

  ngOnInit(): void {
    // Utiliser queryParamMap observable (pas snapshot) pour détecter les changements
    this.route.queryParamMap.subscribe(params => {
      const creditParam = params.get('creditId');
      this.filterCreditId = creditParam ? +creditParam : null;

      const echeanceParam = params.get('echeanceId');
      this.filterEcheanceId = echeanceParam ? +echeanceParam : null;

      if (this.filterCreditId) {
        this.loadEcheances(this.filterCreditId);
      } else if (this.filterEcheanceId) {
        this.loadByEcheanceId(this.filterEcheanceId);
      } else if (this.auth.isClient()) {
        this.loadClientCredits();
      } else {
        this.loadAll();
      }
    });
  }

  loadByEcheanceId(echeanceId: number): void {
    this.loading = true;
    this.error   = null;
    this.cdr.markForCheck();

    const userId = this.auth.getCurrentUserId();
    const source$ = this.auth.isClient() && userId ? this.vm.getByUserId(userId) : this.vm.getAll();

    source$.subscribe({
      next: (data) => {
        this.items = (data ?? []).filter(i => i.echeance.echeanceId === echeanceId);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.error = 'Error loading the specific installment.';
        this.cdr.markForCheck();
      }
    });
  }

  // ── Loading ────────────────────────────────────────

  loadEcheances(creditId: number): void {
    this.loading = true;
    this.error   = null;
    this.items   = [];
    this.cdr.markForCheck();

    const userId = this.auth.getCurrentUserId();

    // Call with ?creditId= (works after backend restart)
    // If backend is old, it returns everything → filter locally
    const source$ = userId
      ? this.vm.getByUserIdAndCreditId(userId, creditId)
      : this.vm.getByCreditId(creditId);

    source$.subscribe({
      next: (data) => {
        const all = data ?? [];

        // Local filtering by creditId (if JSON contains creditId field)
        const filtered = all.filter(item => {
          const cid = (item.echeance as any).creditId;
          // If creditId is present in JSON → filter strictly
          // If absent (old backend) → keep everything (degraded)
          return cid === undefined || cid === null || cid === creditId;
        });

        this.items = filtered.sort((a, b) =>
          a.echeance.echeanceNumber - b.echeance.echeanceNumber
        );
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.error = 'Error loading installments.';
        this.cdr.markForCheck();
      }
    });
  }

  loadClientCredits(): void {
    const userId = this.auth.getCurrentUserId();
    if (!userId) return;
    this.loading = true;
    this.cdr.markForCheck();

    this.creditVm.findByUserId(userId).subscribe({
      next:  (data) => {
        // Only active credits (not applications)
        this.clientCredits = (data ?? []).filter(c =>
          c.status === 'ACTIVE' || c.status === 'COMPLETED'
        );
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.error = 'Error loading your credits.';
        this.cdr.markForCheck();
      }
    });
  }

  loadAll(filterEcheanceId: number | null = null): void {
    this.loading = true;
    this.error   = null;
    this.cdr.markForCheck();

    this.vm.getAll().subscribe({
      next:  (data) => { 
        let allItems = data ?? [];
        if (filterEcheanceId) {
          allItems = allItems.filter(i => i.echeance.echeanceId === filterEcheanceId);
        }
        this.items = allItems; 
        this.loading = false; 
        this.cdr.markForCheck(); 
      },
      error: () => { this.loading = false; this.error = 'Error loading data.'; this.cdr.markForCheck(); }
    });
  }

  selectCredit(creditId: number): void {
    this.filterCreditId = creditId;
    this.loadEcheances(creditId);
  }

  back(): void {
    this.filterCreditId = null;
    this.filterEcheanceId = null;
    this.items = [];
    if (this.auth.isClient()) {
      this.loadClientCredits();
    } else {
      this.loadAll();
    }
  }

  // ── Payment ───────────────────────────────────────────
  pay(echeanceId: number): void {
    const amount = this.payAmounts[echeanceId];
    if (!amount || amount <= 0) {
      this.error = 'Please enter a valid amount.';
      this.cdr.markForCheck();
      return;
    }

    this.payingId = echeanceId;
    this.error    = null;
    this.cdr.markForCheck();

    this.vm.pay(echeanceId, amount).subscribe({
      next: () => {
        this.payAmounts[echeanceId] = 0;
        this.payingId = null;
        this.loadEcheances(this.filterCreditId!);
      },
      error: (err) => {
        this.payingId = null;
        const msg = err?.error?.message || err?.error || err?.message || 'Error processing the payment.';
        this.error = typeof msg === 'string' ? msg : JSON.stringify(msg);
        this.cdr.markForCheck();
      }
    });
  }

  // ── Helpers ────────────────────────────────────────────
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'PAID':           'Paid',
      'PENDING':        'Pending',
      'OVERDUE':        'Overdue',
      'PARTIALLY_PAID': 'Partially Paid'
    };
    return labels[status] ?? status;
  }

  getRepaymentLabel(type: string | undefined): string {
    const labels: Record<string, string> = {
      'AMORTISSEMENT_CONSTANT': 'Constant Amortization',
      'MENSUALITE_CONSTANTE':   'Constant Monthly Payment',
      'IN_FINE':                'In Fine'
    };
    return type ? (labels[type] ?? type) : '—';
  }

  statusClass(status: string | undefined): string {
    if (!status) return 'status-badge--pending';
    return 'status-badge--' + status.toLowerCase();
  }

  rowClass(status: string | undefined): string {
    if (!status) return '';
    return 'row--' + status.toLowerCase();
  }
}

