import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { CreditVm } from '../../vm/credit.vm';
import { Credit } from '../../models/credit.model';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './credit-page.component.html',
  styleUrl: './credit-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreditPageComponent {
  private readonly vm  = inject(CreditVm);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb  = inject(FormBuilder);

  // ── État UI ────────────────────────────────────────────
  submitting = false;
  success: string | null = null;
  error: string | null = null;

  // ── Données statiques de présentation ─────────────────
  readonly repaymentTypes = [
    { value: 'AMORTISSEMENT_CONSTANT', label: 'Amortissement constant' },
    { value: 'MENSUALITE_CONSTANTE',   label: 'Mensualité constante'   },
    { value: 'IN_FINE',                label: 'In fine'                }
  ];

  readonly statuses = [
    { value: 'PENDING',   label: 'Pending'   },
    { value: 'APPROVED',  label: 'Approved'  },
    { value: 'REJECTED',  label: 'Rejected'  },
    { value: 'ACTIVE',    label: 'Active'    },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'DEFAULTED', label: 'Defaulted' }
  ];

  readonly form = this.fb.nonNullable.group({
    userId:        [0,                      [Validators.required, Validators.min(1)]],
    amount:        [0,                      [Validators.required, Validators.min(0.01)]],
    interestRate:  [0,                      [Validators.required, Validators.min(0.01)]],
    termMonths:    [0,                      [Validators.required, Validators.min(1)]],
    startDate:     ['',                     Validators.required],
    endDate:       ['',                     Validators.required],
    repaymentType: ['MENSUALITE_CONSTANTE', Validators.required],
    status:        ['PENDING',              Validators.required],
    income:        [0,                      [Validators.required, Validators.min(0)]],
    dependents:    [0,                      [Validators.required, Validators.min(0)]]
  });

  // ── Actions ────────────────────────────────────────────
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Veuillez remplir tous les champs obligatoires.';
      this.cdr.markForCheck();
      return;
    }

    this.success    = null;
    this.error      = null;
    this.submitting = true;
    this.cdr.markForCheck();

    this.vm.create(this.form.getRawValue() as Credit)
      .pipe(finalize(() => { this.submitting = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.success = 'Crédit créé avec succès.';
          this.form.reset({ repaymentType: 'MENSUALITE_CONSTANTE', status: 'PENDING', dependents: 0 });
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = err?.name === 'TimeoutError'
            ? 'Le serveur met trop de temps à répondre.'
            : (err?.error?.message ?? 'Erreur lors de la création du crédit.');
          this.cdr.markForCheck();
        }
      });
  }
}
