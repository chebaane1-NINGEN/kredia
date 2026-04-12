import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { KycLoanApi } from '../../data-access/kyc-loan.api';
import { DocumentTypeLoan, KycLoanResponse, VerifiedStatus } from '../../models/kyc-loan.model';

interface DocEntry {
  documentType: DocumentTypeLoan;
  label: string;
  icon: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kyc-loan-page.component.html',
  styleUrl: './kyc-loan-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KycLoanPageComponent {
  private readonly api = inject(KycLoanApi);
  private readonly cdr = inject(ChangeDetectorRef);

  /* ── Form state ── */
  creditId = 1;
  userId = 1;
  selectedDocType: DocumentTypeLoan = 'ID_PROOF';
  selectedFile: File | null = null;
  dragOver = false;

  /* ── UI state ── */
  uploading = false;
  verifying = false;
  error: string | null = null;
  uploadedDoc: KycLoanResponse | null = null;
  verifyResult: KycLoanResponse | null = null;
  uploadedDocs: KycLoanResponse[] = [];

  readonly docTypes: DocEntry[] = [
    { documentType: 'ID_PROOF',      label: "Carte / Pièce d'identité",  icon: '🪪' },
    { documentType: 'INCOME_PROOF',  label: 'Justificatif de revenus',   icon: '💰' },
    { documentType: 'SPOUSE_INCOME', label: 'Revenus du conjoint',        icon: '👫' },
    { documentType: 'BANK_STATEMENT',label: 'Relevé bancaire',            icon: '🏦' },
    { documentType: 'OTHER',         label: 'Autre document',             icon: '📎' }
  ];

  /* ── Drag & Drop ── */
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
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.setFile(file);
  }

  private setFile(file: File): void {
    this.selectedFile = file;
    this.uploadedDoc = null;
    this.verifyResult = null;
    this.error = null;
    this.cdr.markForCheck();
  }

  removeFile(): void {
    this.selectedFile = null;
    this.uploadedDoc = null;
    this.verifyResult = null;
    this.error = null;
    this.cdr.markForCheck();
  }

  /* ── Upload ── */
  upload(): void {
    if (!this.selectedFile || !this.creditId || !this.userId) return;

    this.uploading = true;
    this.error = null;
    this.uploadedDoc = null;
    this.verifyResult = null;
    this.cdr.markForCheck();

    this.api
      .upload(this.creditId, this.userId, this.selectedDocType, this.selectedFile)
      .pipe(finalize(() => { this.uploading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (doc) => {
          this.uploadedDoc = doc;
          this.uploadedDocs = [doc, ...this.uploadedDocs];
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = this.extractError(err);
          this.cdr.markForCheck();
        }
      });
  }

  /* ── Verify ── */
  verify(kycLoanId: number): void {
    this.verifying = true;
    this.error = null;
    this.cdr.markForCheck();

    this.api
      .verify(kycLoanId)
      .pipe(finalize(() => { this.verifying = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (result) => {
          this.verifyResult = result;
          // Update in list
          const idx = this.uploadedDocs.findIndex(d => d.kycLoanId === result.kycLoanId);
          if (idx !== -1) this.uploadedDocs[idx] = result;
          this.uploadedDocs = [...this.uploadedDocs];
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = this.extractError(err);
          this.cdr.markForCheck();
        }
      });
  }

  /* ── Helpers ── */
  statusLabel(status: VerifiedStatus): string {
    return { APPROVED: 'Approuvé ✅', REJECTED: 'Rejeté ❌', PENDING: 'En attente ⏳' }[status];
  }

  statusClass(status: VerifiedStatus): string {
    return { APPROVED: 'approved', REJECTED: 'rejected', PENDING: 'pending' }[status];
  }

  docLabel(type: DocumentTypeLoan): string {
    return this.docTypes.find(d => d.documentType === type)?.label ?? type;
  }

  fileSizeLabel(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  private extractError(err: any): string {
    console.error('KYC API Error:', err);
    // Network error (backend unreachable / CORS)
    if (err instanceof ProgressEvent || err?.error instanceof ProgressEvent) {
      return 'Impossible de contacter le serveur. Vérifiez que le backend est lancé sur le port 8081.';
    }
    // Backend returned a JSON error object with a message field
    if (err?.error && typeof err.error === 'object') {
      return err.error.message ?? err.error.error ?? JSON.stringify(err.error);
    }
    // Backend returned a plain string error
    if (err?.error && typeof err.error === 'string') {
      return err.error;
    }
    // HttpErrorResponse message
    if (err?.message && typeof err.message === 'string') {
      return err.message;
    }
    return 'Une erreur inattendue s\'est produite.';
  }
}
