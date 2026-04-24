import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { KycLoanVm } from '../../vm/kyc-loan.vm';
import { DocumentTypeLoan, KycLoanResponse, VerifiedStatus } from '../../models/kyc-loan.model';
import { AuthService } from '../../../../../core/services/auth.service';
import { CreditVm } from '../../../Credit/vm/credit.vm';
import { Credit, DemandeCredit } from '../../../Credit/models/credit.model';

export interface DocEntry {
  documentType: DocumentTypeLoan;
  label: string;
  icon: string;
}

/**
 * Component = ViewModel
 * Contient tout l'état UI, la logique de présentation et les actions.
 * Délègue les appels données au service KycLoanVm.
 */
@Component({
  standalone: false,
  templateUrl: './kyc-loan-page.component.html',
  styleUrl: './kyc-loan-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KycLoanPageComponent implements OnInit {
  private readonly vm  = inject(KycLoanVm);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly auth        = inject(AuthService);
  private readonly creditVm = inject(CreditVm);

  // ── État UI ────────────────────────────────────────────
  // Pour CLIENT : userId est lu depuis le JWT. Pour admin, on garde la saisie manuelle.
  creditId        = 1;
  userId          = 1;
  selectedDocType: DocumentTypeLoan = 'ID_PROOF';
  selectedFile: File | null = null;
  dragOver        = false;

  uploading       = false;
  verifying       = false;
  hasCreditsError = false;
  error: string | null = null;
  uploadedDoc: KycLoanResponse | null = null;
  verifyResult: KycLoanResponse | null = null;
  uploadedDocs: KycLoanResponse[] = [];
  clientCredits: Credit[] = [];
  clientDemandes: DemandeCredit[] = [];

  // ── Données statiques de présentation ─────────────────
  readonly docTypes: DocEntry[] = [
    { documentType: 'ID_PROOF',       label: 'ID Card / Passport',   icon: '🪪' },
    { documentType: 'INCOME_PROOF',   label: 'Proof of Income',      icon: '💰' },
    { documentType: 'SPOUSE_INCOME',  label: "Spouse's Income",      icon: '👫' },
    { documentType: 'BANK_STATEMENT', label: 'Bank Statement',       icon: '🏦' },
    { documentType: 'OTHER',          label: 'Other Document',       icon: '📎' }
  ];

  ngOnInit(): void {
    const tokenUserId = this.auth.getCurrentUserId();
    if (this.auth.isClient() && tokenUserId) {
      this.userId = tokenUserId;
      this.loadClientDocs();
      this.autoSelectCredit();
    } else if (!this.auth.isClient()) {
      // For Admin: load all submitted documents
      this.loadAllDocs();
    }
  }

  // ── Auto-Select Credit (CLIENT) ──────────────────────
  autoSelectCredit(): void {
    // Load active/completed credits
    this.creditVm.findByUserId(this.userId).subscribe({
      next: (credits) => {
        this.clientCredits = credits || [];
        this.cdr.markForCheck();
      }
    });

    // Load pending/approved/rejected demandes
    this.creditVm.findDemandesByUserId(this.userId).subscribe({
      next: (demandes) => {
        this.clientDemandes = demandes || [];
        // Auto-select first available option
        const allOptions = [...this.clientCredits, ...this.clientDemandes];
        if (allOptions.length > 0) {
          this.creditId = (this.clientCredits[0]?.creditId ?? this.clientDemandes[0]?.creditId) ?? 1;
          this.hasCreditsError = false;
        } else {
          this.hasCreditsError = true;
        }
        this.cdr.markForCheck();
      }
    });
  }

  // ── Charger les docs existants du client ──────────────
  loadClientDocs(): void {
    this.vm.getByUserId(this.userId).subscribe({
      next: (docs) => {
        this.uploadedDocs = docs ?? [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.cdr.markForCheck();
      }
    });
  }

  // ── Charger TOUS les docs (ADMIN) ─────────────────────
  loadAllDocs(): void {
    this.vm.getAll().subscribe({
      next: (docs) => {
        this.uploadedDocs = docs ?? [];
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = 'Error loading documents: ' + this.extractError(err);
        this.cdr.markForCheck();
      }
    });
  }  // ── Drag & Drop ────────────────────────────────────────
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = true;
    this.cdr.markForCheck();
  }

  onDragLeave(): void {
    this.dragOver = false;
    this.cdr.markForCheck();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.setFile(file);
  }

  onFileInput(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.setFile(file);
  }

  setFile(file: File): void {
    this.selectedFile  = file;
    this.uploadedDoc   = null;
    this.verifyResult  = null;
    this.error         = null;
    this.cdr.markForCheck();
  }

  removeFile(): void {
    this.selectedFile  = null;
    this.uploadedDoc   = null;
    this.verifyResult  = null;
    this.error         = null;
    this.cdr.markForCheck();
  }

  // ── Actions ────────────────────────────────────────────
  upload(): void {
    if (!this.selectedFile || !this.creditId || !this.userId) return;

    this.uploading    = true;
    this.error        = null;
    this.uploadedDoc  = null;
    this.verifyResult = null;
    this.cdr.markForCheck();

    this.vm.upload(this.creditId, this.userId, this.selectedDocType, this.selectedFile)
      .pipe(finalize(() => { this.uploading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (doc) => {
          this.uploadedDoc  = doc;
          this.uploadedDocs = [doc, ...this.uploadedDocs];
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = this.extractError(err);
          this.cdr.markForCheck();
        }
      });
  }

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

  readonly typeOptions = [
    { value: 'ALL',           label: 'All Types' },
    { value: 'ID_PROOF',      label: '🪪 ID Card' },
    { value: 'INCOME_PROOF',  label: '💰 Income' },
    { value: 'SPOUSE_INCOME', label: '👫 Spouse' },
    { value: 'BANK_STATEMENT',label: '🏦 Bank Statement' },
    { value: 'OTHER',         label: '📎 Other' },
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
      const matchType    = this.typeFilter    === 'ALL' || doc.documentType   === this.typeFilter;
      const matchCredit  = this.creditFilter  === 'ALL' || doc.creditId  === +this.creditFilter;
      const matchDemande = this.demandeFilter === 'ALL' || doc.demandeId === +this.demandeFilter;
      return matchStatus && matchType && matchCredit && matchDemande;
    });
  }

  get pendingRejectedDemandes(): DemandeCredit[] {
    return this.clientDemandes.filter(d => d.status === 'PENDING');
  }

  setStatusFilter(v: string): void { this.statusFilter = v; this.cdr.markForCheck(); }
  setTypeFilter(v: string):   void { this.typeFilter   = v; this.cdr.markForCheck(); }
  setCreditFilter(v: string): void { this.creditFilter = v; this.cdr.markForCheck(); }
  setDemandeFilter(v: string): void { this.demandeFilter = v; this.cdr.markForCheck(); }

  selectDoc(doc: KycLoanResponse): void {
    this.verifyResult = doc;
    this.uploadedDoc  = null;
    this.cdr.markForCheck();
  }

  fixCreditLinks(): void {
    this.vm.fixCreditLinks().subscribe({
      next: (msg) => {
        alert(msg);
        this.loadAllDocs();
      },
      error: () => alert('Error fixing credit links.')
    });
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

  fileSizeLabel(bytes: number): string {
    if (bytes < 1024)            return `${bytes} B`;
    if (bytes < 1024 * 1024)     return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  private extractError(err: any): string {
    if (err instanceof ProgressEvent || err?.error instanceof ProgressEvent)
      return 'Unable to reach the server. Please check that the backend is running on port 8081.';
    if (err?.error && typeof err.error === 'object')
      return err.error.message ?? err.error.error ?? JSON.stringify(err.error);
    if (err?.error && typeof err.error === 'string') return err.error;
    if (err?.message && typeof err.message === 'string') return err.message;
    return 'An unexpected error occurred.';
  }
}

