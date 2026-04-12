import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EcheanceApi } from '../../data-access/echeance.api';
import { EcheancePaymentResponse } from '../../models/echeance.model';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './echeance-page.component.html',
  styleUrl: './echeance-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EcheancePageComponent {
  private readonly api = inject(EcheanceApi);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  error: string | null = null;
  items: EcheancePaymentResponse[] = [];
  payAmounts: Record<number, number> = {};
  payingId: number | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.api.getAll().subscribe({
      next: (data) => {
        this.items = data ?? [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.error = 'Erreur lors du chargement des échéances.';
        this.cdr.markForCheck();
      }
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
    this.error = null;
    this.cdr.markForCheck();

    this.api.pay(echeanceId, amount).subscribe({
      next: () => {
        this.payAmounts[echeanceId] = 0;
        this.payingId = null;
        this.load();
      },
      error: () => {
        this.payingId = null;
        this.error = 'Erreur lors du paiement de l’échéance.';
        this.cdr.markForCheck();
      }
    });
  }
}
