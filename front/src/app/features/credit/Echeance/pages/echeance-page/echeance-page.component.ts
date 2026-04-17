import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EcheanceVm } from '../../vm/echeance.vm';
import { EcheancePaymentResponse } from '../../models/echeance.model';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './echeance-page.component.html',
  styleUrl: './echeance-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EcheancePageComponent implements OnInit {
  private readonly vm  = inject(EcheanceVm);
  private readonly cdr = inject(ChangeDetectorRef);

  // ── État UI ────────────────────────────────────────────
  loading = false;
  error: string | null = null;
  items: EcheancePaymentResponse[] = [];
  payAmounts: Record<number, number> = {};
  payingId: number | null = null;

  ngOnInit(): void {
    this.load();
  }

  // ── Actions ────────────────────────────────────────────
  load(): void {
    this.loading = true;
    this.error   = null;
    this.cdr.markForCheck();

    this.vm.getAll().subscribe({
      next:  (data) => { this.items = data ?? []; this.loading = false; this.cdr.markForCheck(); },
      error: ()     => { this.loading = false; this.error = 'Erreur lors du chargement des échéances.'; this.cdr.markForCheck(); }
    });
  }

  pay(echeanceId: number): void {
    const amount = this.payAmounts[echeanceId];
    if (!amount || amount <= 0) {
      this.error = 'Veuillez saisir un montant valide.';
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
        this.load();
      },
      error: () => {
        this.payingId = null;
        this.error    = "Erreur lors du paiement de l'échéance.";
        this.cdr.markForCheck();
      }
    });
  }
}
