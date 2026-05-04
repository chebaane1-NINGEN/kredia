import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ReclamationHistory } from '../../models/reclamation-history.model';
import { ReclamationHistoryVm } from '../../vm/reclamation-history.vm';

@Component({
  selector: 'app-reclamation-history-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reclamation-history-page.component.html',
  styleUrl: './reclamation-history-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReclamationHistoryPageComponent {
  private readonly vm = inject(ReclamationHistoryVm);
  private readonly cdr = inject(ChangeDetectorRef);

  reclamationId = 0;
  rows: ReclamationHistory[] = [];
  loading = false;
  error: string | null = null;

  loadHistory(): void {
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
        next: (rows) => {
          this.rows = rows;
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.error = this.readError(error, 'Impossible de charger l historique.');
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

  statusLabel(status?: string | null): string {
    switch (status) {
      case 'OPEN':
        return 'Recu';
      case 'IN_PROGRESS':
        return 'En traitement';
      case 'WAITING_CUSTOMER':
        return 'Attente client';
      case 'ESCALATED':
        return 'Prioritaire';
      case 'REOPENED':
        return 'Rouvert';
      case 'RESOLVED':
        return 'Resolu';
      case 'REJECTED':
        return 'Cloture';
      default:
        return status || '-';
    }
  }

  actorLabel(row: ReclamationHistory): string {
    return row.actorUserId ? 'Intervention support' : 'Action systeme';
  }

  trackHistory(index: number, row: ReclamationHistory): number {
    return row.historyId ?? index;
  }

  private readError(error: unknown, fallback: string): string {
    const maybeError = error as { error?: { message?: string; details?: string; error?: string }; message?: string };
    return maybeError.error?.message ?? maybeError.error?.details ?? maybeError.error?.error ?? maybeError.message ?? fallback;
  }
}
