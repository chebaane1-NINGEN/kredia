import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CreditVm } from '../../vm/credit.vm';
import { Credit } from '../../models/credit.model';
import { downloadBlob } from '../../../../../core/utils/download.util';
import { AuthService } from '../../../../../core/services/auth.service';

/**
 * Component = ViewModel
 * État UI, logique de présentation, actions.
 * Délègue les appels données à CreditVm (service).
 */
@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './credit-list-page.component.html',
  styleUrl: './credit-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreditListPageComponent implements OnInit {
  private readonly vm   = inject(CreditVm);
  private readonly cdr  = inject(ChangeDetectorRef);
  readonly auth         = inject(AuthService);

  // ── État UI ────────────────────────────────────────────
  credits: Credit[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadCredits();
  }

  // ── Actions ────────────────────────────────────────────
  loadCredits(): void {
    this.loading = true;
    this.error   = null;
    this.cdr.markForCheck();

    const userId = this.auth.getCurrentUserId();
    const request$ = this.auth.isClient() && userId
      ? this.vm.findByUserId(userId)
      : this.vm.findAll();

    request$
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next:  (data) => { this.credits = data ?? []; this.cdr.markForCheck(); },
        error: ()     => { this.error = 'Impossible de charger la liste des crédits.'; this.cdr.markForCheck(); }
      });
  }

  downloadExcel(id: number): void {
    this.vm.exportExcel(id).subscribe({
      next:  (blob) => downloadBlob(blob, `credit_${id}.xlsx`),
      error: ()     => { this.error = `Échec de l'export Excel pour le crédit #${id}.`; this.cdr.markForCheck(); }
    });
  }

  downloadPdf(id: number): void {
    this.vm.exportPdf(id).subscribe({
      next:  (blob) => downloadBlob(blob, `statistiques_credit_${id}.pdf`),
      error: ()     => { this.error = `Échec de l'export PDF pour le crédit #${id}.`; this.cdr.markForCheck(); }
    });
  }

  // ── Helpers de présentation ────────────────────────────
  getStatusClass(status: string | undefined): string {
    return status ? `status--${status.toLowerCase()}` : '';
  }

  /** Libellé du type de remboursement */
  getRepaymentLabel(type: string | undefined): string {
    const labels: Record<string, string> = {
      'AMORTISSEMENT_CONSTANT': 'Amortissement constant',
      'MENSUALITE_CONSTANTE':   'Mensualité constante',
      'IN_FINE':                'In fine'
    };
    return type ? (labels[type] ?? type) : '—';
  }
}

