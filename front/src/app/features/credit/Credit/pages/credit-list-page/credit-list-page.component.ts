import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CreditVm } from '../../vm/credit.vm';
import { Credit, DemandeCredit } from '../../models/credit.model';
import { downloadBlob } from '../../../../../core/utils/download.util';
import { AuthService } from '../../../../../core/services/auth.service';
import { KycLoanVm } from '../../../KycLoan/vm/kyc-loan.vm';
import { KycLoanResponse } from '../../../KycLoan/models/kyc-loan.model';

@Component({
  standalone: false,
  templateUrl: './credit-list-page.component.html',
  styleUrl: './credit-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreditListPageComponent implements OnInit {
  private readonly vm    = inject(CreditVm);
  private readonly cdr   = inject(ChangeDetectorRef);
  readonly auth          = inject(AuthService);
  private readonly kycVm = inject(KycLoanVm);
  private readonly route = inject(ActivatedRoute);

  filterDemandeId: number | null = null;

  credits: Credit[]         = [];
  demandes: DemandeCredit[] = [];
  clientDemandes: DemandeCredit[] = [];
  clientCredits: Credit[]   = [];

  loading = false;
  error: string | null = null;
  viewMode: 'ALL' | 'PENDING' = 'ALL';

  // ── KYC Modal ─────────────────────────────────────────
  kycModalOpen     = false;
  kycModalLoading  = false;
  kycModalDocs: KycLoanResponse[] = [];
  kycModalDemandeId: number | null = null;
  filterKycLoanId: number | null = null;

  openKycDetails(demandeId: number): void {
    this.kycModalOpen      = true;
    this.kycModalLoading   = true;
    this.kycModalDemandeId = demandeId;
    this.kycModalDocs      = [];
    this.cdr.markForCheck();
    this.kycVm.getByDemandeId(demandeId).subscribe({
      next:  (docs) => { 
        let all = docs ?? [];
        if (this.filterKycLoanId) {
          all = all.filter(d => d.kycLoanId === this.filterKycLoanId);
        }
        this.kycModalDocs = all; 
        this.kycModalLoading = false; 
        this.cdr.markForCheck(); 
      },
      error: ()     => { this.kycModalLoading = false; this.cdr.markForCheck(); }
    });
  }

  clearKycFilter(): void {
    this.filterKycLoanId = null;
    if (this.kycModalDemandeId) {
      this.openKycDetails(this.kycModalDemandeId);
    }
  }

  closeKycModal(): void {
    this.kycModalOpen = false;
    this.kycModalDocs = [];
    this.cdr.markForCheck();
  }

  // ── Rejection Reason Modal ──────────────────────────────
  selectedReasonDemande: DemandeCredit | null = null;
  rejectionReasonText = '';
  rejectionReasonLoading = false;

  showDemandeReason(d: DemandeCredit): void {
    this.selectedReasonDemande = d;
    this.rejectionReasonLoading = true;
    this.rejectionReasonText = '';
    this.cdr.markForCheck();

    this.kycVm.getByDemandeId(d.creditId!).subscribe({
      next: (docs) => {
        let reasons: string[] = [];
        if (d.isFeePaid === false) {
          reasons.push('Application fees not paid');
        }
        if (docs && docs.some(doc => doc.verifiedStatus === 'REJECTED')) {
          reasons.push('KYC documents rejected');
        }
        if (reasons.length === 0) {
          reasons.push('Rejected by administrator');
        }
        this.rejectionReasonText = reasons.join(' & ');
        this.rejectionReasonLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.rejectionReasonText = 'Error loading reason.';
        this.rejectionReasonLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  closeDemandeReason(): void {
    this.selectedReasonDemande = null;
    this.cdr.markForCheck();
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const demandeId = params.get('demandeId');
      this.filterDemandeId = demandeId ? +demandeId : null;

      const kycLoanId = params.get('filterKycLoanId');
      this.filterKycLoanId = kycLoanId ? +kycLoanId : null;

      const openKycId = params.get('openKycDemandeId');
      
      if (this.filterDemandeId && !this.auth.isClient()) {
        this.viewMode = 'PENDING';
      }
      
      this.loadData();

      if (openKycId && !this.auth.isClient()) {
        this.viewMode = 'PENDING';
        this.openKycDetails(+openKycId);
      }
    });
  }

  setViewMode(mode: 'ALL' | 'PENDING'): void {
    this.viewMode = mode;
    this.filterDemandeId = null;
    this.loadData();
  }

  loadData(): void {
    this.auth.isClient() ? this.loadClientDemandes() : this.loadAdminData();
  }

  loadCredits(): void { this.loadData(); }

  private loadClientDemandes(): void {
    const userId = this.auth.getCurrentUserId();
    if (!userId) { this.error = 'Session expired.'; this.cdr.markForCheck(); return; }

    this.loading = true;
    this.error   = null;
    this.cdr.markForCheck();

    this.vm.findDemandesByUserId(userId)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next:  (data: DemandeCredit[]) => { 
          let all = data ?? [];
          if (this.filterDemandeId) {
            all = all.filter(d => d.creditId === this.filterDemandeId);
          }
          this.clientDemandes = all; 
          this.cdr.markForCheck(); 
        },
        error: ()                       => { this.error = 'Unable to load your applications.'; this.cdr.markForCheck(); }
      });
  }

  private loadAdminData(): void {
    this.loading = true;
    this.error   = null;
    this.cdr.markForCheck();

    if (this.viewMode === 'PENDING') {
      this.vm.getPendingDemandes()
        .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
        .subscribe({
          next:  (data: DemandeCredit[]) => { 
            let all = data ?? [];
            if (this.filterDemandeId) {
              all = all.filter(d => d.creditId === this.filterDemandeId);
            }
            this.demandes = all; 
            this.cdr.markForCheck(); 
          },
          error: ()                       => { this.error = 'Unable to load pending applications.'; this.cdr.markForCheck(); }
        });
    } else {
      this.vm.findAll()
        .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
        .subscribe({
          next:  (data: Credit[]) => { this.credits = data ?? []; this.cdr.markForCheck(); },
          error: ()               => { this.error = 'Unable to load credits.'; this.cdr.markForCheck(); }
        });
    }
  }

  approveCredit(id: number): void {
    if (!confirm('Approve this application? A 15% interest rate will be applied automatically.')) return;
    this.vm.approveCredit(id).subscribe({
      next:  () => this.loadData(),
      error: () => { this.error = 'Error approving the application.'; this.cdr.markForCheck(); }
    });
  }

  rejectCredit(id: number): void {
    if (!confirm('Reject this credit application?')) return;
    this.vm.rejectCredit(id).subscribe({
      next:  () => this.loadData(),
      error: () => { this.error = 'Error rejecting the application.'; this.cdr.markForCheck(); }
    });
  }

  downloadExcel(id: number): void {
    this.vm.exportExcel(id).subscribe({
      next:  (blob) => downloadBlob(blob, `credit_${id}.xlsx`),
      error: ()     => { this.error = `Excel export failed for credit #${id}.`; this.cdr.markForCheck(); }
    });
  }

  downloadPdf(id: number): void {
    this.vm.exportPdf(id).subscribe({
      next:  (blob) => downloadBlob(blob, `statistiques_credit_${id}.pdf`),
      error: ()     => { this.error = `PDF export failed for credit #${id}.`; this.cdr.markForCheck(); }
    });
  }

  getStatusClass(status: string | undefined): string {
    return status ? `status--${status.toLowerCase()}` : '';
  }

  getStatusLabel(status: string | undefined): string {
    const m: Record<string, string> = {
      PENDING: 'Pending', APPROVED: 'Approved', REJECTED: 'Rejected',
      ACTIVE: 'Active', COMPLETED: 'Completed', DEFAULTED: 'Defaulted'
    };
    return status ? (m[status] ?? status) : '—';
  }

  getRepaymentLabel(type: string | undefined): string {
    const m: Record<string, string> = {
      AMORTISSEMENT_CONSTANT: 'Constant Amortization',
      MENSUALITE_CONSTANTE:   'Constant Monthly Payment',
      IN_FINE:                'In Fine'
    };
    return type ? (m[type] ?? type) : '—';
  }
}
