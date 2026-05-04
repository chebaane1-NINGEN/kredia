import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../../core/services/auth.service';
import { ReclamationAttachment } from '../../models/reclamation-attachment.model';
import { ReclamationAttachmentVm } from '../../vm/reclamation-attachment.vm';

@Component({
  selector: 'app-reclamation-attachment-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reclamation-attachment-page.component.html',
  styleUrl: './reclamation-attachment-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReclamationAttachmentPageComponent {
  private readonly vm = inject(ReclamationAttachmentVm);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly auth = inject(AuthService);

  reclamationId = 0;
  uploadedByUserId = this.auth.getCurrentUserId() ?? 0;
  selectedFile: File | null = null;
  attachments: ReclamationAttachment[] = [];
  loading = false;
  actionLoading = false;
  error: string | null = null;
  success: string | null = null;

  loadAttachments(): void {
    if (!this.reclamationId) {
      this.error = 'Veuillez saisir le numero du dossier.';
      return;
    }

    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.vm.findByReclamation(Number(this.reclamationId))
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (attachments) => {
          this.attachments = attachments;
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.error = this.readError(error, 'Impossible de charger les pieces jointes.');
          this.cdr.markForCheck();
        }
      });
  }

  upload(): void {
    if (!this.reclamationId || !this.uploadedByUserId || !this.selectedFile) {
      this.error = 'Veuillez choisir un dossier et un fichier.';
      return;
    }

    this.actionLoading = true;
    this.error = null;
    this.success = null;
    this.cdr.markForCheck();

    this.vm.upload(Number(this.reclamationId), Number(this.uploadedByUserId), this.selectedFile)
      .pipe(finalize(() => {
        this.actionLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.success = 'Piece jointe ajoutee.';
          this.selectedFile = null;
          this.loadAttachments();
        },
        error: (error: unknown) => {
          this.error = this.readError(error, 'Impossible d uploader le fichier.');
          this.cdr.markForCheck();
        }
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.item(0) ?? null;
  }

  formatDate(value?: string): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('fr-FR');
  }

  formatBytes(value?: number | null): string {
    if (!value) {
      return '-';
    }

    if (value < 1024) {
      return `${value} B`;
    }

    return value < 1024 * 1024 ? `${(value / 1024).toFixed(1)} KB` : `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  fileBadge(contentType?: string | null): string {
    if (!contentType) {
      return 'FILE';
    }

    if (contentType.includes('pdf')) {
      return 'PDF';
    }

    if (contentType.includes('image')) {
      return 'IMG';
    }

    if (contentType.includes('word') || contentType.includes('document')) {
      return 'DOC';
    }

    return 'FILE';
  }

  trackAttachment(index: number, attachment: ReclamationAttachment): number {
    return attachment.attachmentId ?? index;
  }

  private readError(error: unknown, fallback: string): string {
    const maybeError = error as { error?: { message?: string; details?: string; error?: string }; message?: string };
    return maybeError.error?.message ?? maybeError.error?.details ?? maybeError.error?.error ?? maybeError.message ?? fallback;
  }
}
