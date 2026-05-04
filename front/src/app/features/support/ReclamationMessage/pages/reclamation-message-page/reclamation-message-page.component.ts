import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../../core/services/auth.service';
import { ReclamationMessage, ReclamationMessageCreateRequest, ReclamationMessageVisibility } from '../../models/reclamation-message.model';
import { ReclamationMessageVm } from '../../vm/reclamation-message.vm';

@Component({
  selector: 'app-reclamation-message-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reclamation-message-page.component.html',
  styleUrl: './reclamation-message-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReclamationMessagePageComponent implements OnInit {
  private readonly vm = inject(ReclamationMessageVm);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly auth = inject(AuthService);

  readonly visibilities: ReclamationMessageVisibility[] = ['CUSTOMER', 'INTERNAL'];

  reclamationId = 0;
  includeInternal = !this.auth.isClient();
  messages: ReclamationMessage[] = [];
  loading = false;
  actionLoading = false;
  error: string | null = null;
  success: string | null = null;

  draft: ReclamationMessageCreateRequest = {
    authorUserId: this.auth.getCurrentUserId() ?? 0,
    visibility: 'CUSTOMER',
    message: ''
  };

  ngOnInit(): void {
    this.draft.authorUserId = this.auth.getCurrentUserId() ?? 0;
  }

  loadMessages(): void {
    if (!this.reclamationId) {
      this.error = 'Veuillez saisir le numero du dossier.';
      return;
    }

    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.vm.findByReclamation(Number(this.reclamationId), this.includeInternal)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (messages) => {
          this.messages = messages;
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.error = this.readError(error, 'Impossible de charger les messages.');
          this.cdr.markForCheck();
        }
      });
  }

  sendMessage(): void {
    if (!this.reclamationId || this.draft.message.trim().length < 2) {
      this.error = 'Veuillez choisir un dossier et saisir un message.';
      return;
    }

    this.actionLoading = true;
    this.error = null;
    this.success = null;
    this.cdr.markForCheck();

    this.vm.send(Number(this.reclamationId), {
      authorUserId: Number(this.draft.authorUserId),
      visibility: this.draft.visibility,
      message: this.draft.message.trim()
    })
      .pipe(finalize(() => {
        this.actionLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.success = 'Message ajoute.';
          this.draft.message = '';
          this.loadMessages();
        },
        error: (error: unknown) => {
          this.error = this.readError(error, 'Impossible d envoyer le message.');
          this.cdr.markForCheck();
        }
      });
  }

  formatDate(value?: string): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('fr-FR');
  }

  authorLabel(message: ReclamationMessage): string {
    return message.authorUserId === this.draft.authorUserId ? 'Equipe support' : 'Client';
  }

  visibilityLabel(visibility: ReclamationMessageVisibility): string {
    return visibility === 'INTERNAL' ? 'Note interne' : 'Client';
  }

  trackMessage(index: number, message: ReclamationMessage): number {
    return message.messageId ?? index;
  }

  private readError(error: unknown, fallback: string): string {
    const maybeError = error as { error?: { message?: string; details?: string; error?: string }; message?: string };
    return maybeError.error?.message ?? maybeError.error?.details ?? maybeError.error?.error ?? maybeError.message ?? fallback;
  }
}
