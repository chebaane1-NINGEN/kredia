import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { KycLoanVm } from '../../vm/kyc-loan.vm';
import { DocumentTypeLoan, KycLoanResponse, VerifiedStatus } from '../../models/kyc-loan.model';
import { AuthService } from '../../../../../core/services/auth.service';

export interface DocEntry {
  documentType: DocumentTypeLoan;
  label: string;
  icon: string;
}

@Component({
  standalone: false,
  templateUrl: './kyc-loan-admin-page.component.html',
  styleUrl: './kyc-loan-admin-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KycLoanAdminPageComponent implements OnInit {
  private readonly vm  = inject(KycLoanVm);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly auth        = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  // ── État UI ────────────────────────────────────────────
  uploading       = false;
  verifying       = false;
  error: string | null = null;
  verifyResult: KycLoanResponse | null = null;
  uploadedDocs: KycLoanResponse[] = [];

  // ── Données statiques de présentation ─────────────────
  readonly docTypes: DocEntry[] = [
    { documentType: 'ID_PROOF',       label: 'ID Card / Passport',   icon: '🪪' },
    { documentType: 'INCOME_PROOF',   label: 'Proof of Income',      icon: '💰' },
    { documentType: 'SPOUSE_INCOME',  label: "Spouse's Income",      icon: '👫' },
    { documentType: 'BANK_STATEMENT', label: 'Bank Statement',       icon: '🏦' },
    { documentType: 'OTHER',          label: 'Other Document',       icon: '📎' }
  ];

  pendingSelectionKycLoanId: number | null = null;

  ngOnInit(): void {
    this.loadAllDocs();

    this.route.queryParams.subscribe(params => {
      if (params['demandeId']) {
        this.demandeFilter = params['demandeId'];
        this.cdr.markForCheck();
      }
      if (params['kycLoanId']) {
        this.pendingSelectionKycLoanId = +params['kycLoanId'];
        this.trySelectPendingDoc();
      }
    });
  }

  trySelectPendingDoc(): void {
    if (this.pendingSelectionKycLoanId && this.uploadedDocs.length > 0) {
      const doc = this.uploadedDocs.find(d => d.kycLoanId === this.pendingSelectionKycLoanId);
      if (doc) {
        this.selectDoc(doc);
        this.pendingSelectionKycLoanId = null;
        this.cdr.markForCheck();
      }
    }
  }

  loadAllDocs(): void {
    this.vm.getAll().subscribe({
      next: (docs) => {
        this.uploadedDocs = docs ?? [];
        this.trySelectPendingDoc();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = 'Error loading documents: ' + this.extractError(err);
        this.cdr.markForCheck();
      }
    });
  }

  // ── Actions ────────────────────────────────────────────
  verify(kycLoanId: number): void {
    this.verifying = true;
    this.error     = null;
    this.cdr.markForCheck();

    this.vm.verify(kycLoanId)
      .pipe(finalize(() => { this.verifying = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (result) => {
          this.verifyResult  = result;
          this.uploadedDocs  = this.uploadedDocs.map(d =>
            d.kycLoanId === result.kycLoanId ? result : d
          );
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = this.extractError(err);
          this.cdr.markForCheck();
        }
      });
  }

  approve(kycLoanId: number): void {
    this.verifying = true;
    this.error = null;
    this.cdr.markForCheck();
    this.vm.approve(kycLoanId)
      .pipe(finalize(() => { this.verifying = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (result) => {
          this.verifyResult = result;
          this.uploadedDocs = this.uploadedDocs.map(d => d.kycLoanId === result.kycLoanId ? result : d);
          this.cdr.markForCheck();
        },
        error: (err) => { this.error = this.extractError(err); this.cdr.markForCheck(); }
      });
  }

  reject(kycLoanId: number): void {
    this.verifying = true;
    this.error = null;
    this.cdr.markForCheck();
    this.vm.reject(kycLoanId)
      .pipe(finalize(() => { this.verifying = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (result) => {
          this.verifyResult = result;
          this.uploadedDocs = this.uploadedDocs.map(d => d.kycLoanId === result.kycLoanId ? result : d);
          this.cdr.markForCheck();
        },
        error: (err) => { this.error = this.extractError(err); this.cdr.markForCheck(); }
      });
  }

  // ── Filters ───────────────────────────────────────────
  statusFilter: string  = 'ALL';
  typeFilter: string    = 'ALL';
  creditFilter: string  = 'ALL';
  demandeFilter: string = 'ALL';

  readonly statusOptions = [
    { value: 'ALL',      label: 'All' },
    { value: 'PENDING',  label: '⏳ Pending' },
    { value: 'APPROVED', label: '✅ Approved' },
    { value: 'REJECTED', label: '❌ Rejected' },
  ];

  get uniqueCreditIds(): number[] {
    return [...new Set(this.uploadedDocs.filter(d => d.creditId != null).map(d => d.creditId as number))]
      .sort((a, b) => a - b);
  }

  get uniqueDemandeIds(): number[] {
    return [...new Set(this.uploadedDocs.filter(d => d.demandeId != null).map(d => d.demandeId as number))]
      .sort((a, b) => a - b);
  }

  get filteredDocs(): KycLoanResponse[] {
    return this.uploadedDocs.filter(doc => {
      const matchStatus  = this.statusFilter  === 'ALL' || doc.verifiedStatus === this.statusFilter;
      const matchCredit  = this.creditFilter  === 'ALL' || doc.creditId  === +this.creditFilter;
      const matchDemande = this.demandeFilter === 'ALL' || doc.demandeId === +this.demandeFilter;
      return matchStatus && matchCredit && matchDemande;
    });
  }

  setStatusFilter(v: string): void { this.statusFilter = v; this.cdr.markForCheck(); }
  setCreditFilter(v: string): void { this.creditFilter = v; this.cdr.markForCheck(); }
  setDemandeFilter(v: string): void { this.demandeFilter = v; this.cdr.markForCheck(); }

  selectDoc(doc: KycLoanResponse): void {
    this.verifyResult = doc;
    this.cdr.markForCheck();
  }

  statusLabel(status: VerifiedStatus): string {
    return { APPROVED: 'Approved ✅', REJECTED: 'Rejected ❌', PENDING: 'Pending ⏳' }[status];
  }

  statusClass(status: VerifiedStatus): string {
    return { APPROVED: 'approved', REJECTED: 'rejected', PENDING: 'pending' }[status];
  }

  docLabel(type: DocumentTypeLoan): string {
    return this.docTypes.find(d => d.documentType === type)?.label ?? type;
  }

  private extractError(err: any): string {
    if (err instanceof ProgressEvent || err?.error instanceof ProgressEvent)
      return 'Unable to reach the server.';
    if (err?.error && typeof err.error === 'object')
      return err.error.message ?? err.error.error ?? JSON.stringify(err.error);
    return err?.message ?? 'An unexpected error occurred.';
  }
}
