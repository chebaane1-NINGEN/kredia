import { Injectable, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { CreditApi } from '../data-access/credit.api';
import { Credit } from '../models/credit.model';

@Injectable()
export class CreditFormVm {
  private readonly api = inject(CreditApi);
  private readonly fb  = inject(FormBuilder);

  // ── State ──────────────────────────────────────────────
  readonly submitting = signal(false);
  readonly success    = signal<string | null>(null);
  readonly error      = signal<string | null>(null);

  // ── Form ───────────────────────────────────────────────
  readonly repaymentTypes = [
    { value: 'AMORTISSEMENT_CONSTANT', label: 'Amortissement constant' },
    { value: 'MENSUALITE_CONSTANTE',   label: 'Mensualité constante'   },
    { value: 'IN_FINE',                label: 'In fine'                }
  ] as const;

  readonly statuses = [
    { value: 'PENDING',   label: 'Pending'   },
    { value: 'APPROVED',  label: 'Approved'  },
    { value: 'REJECTED',  label: 'Rejected'  },
    { value: 'ACTIVE',    label: 'Active'    },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'DEFAULTED', label: 'Defaulted' }
  ] as const;

  readonly form = this.fb.nonNullable.group({
    userId:        [0,                    [Validators.required, Validators.min(1)]],
    amount:        [0,                    [Validators.required, Validators.min(0.01)]],
    interestRate:  [0,                    [Validators.required, Validators.min(0.01)]],
    termMonths:    [0,                    [Validators.required, Validators.min(1)]],
    startDate:     ['',                   Validators.required],
    endDate:       ['',                   Validators.required],
    repaymentType: ['MENSUALITE_CONSTANTE', Validators.required],
    status:        ['PENDING',            Validators.required],
    income:        [0,                    [Validators.required, Validators.min(0)]],
    dependents:    [0,                    [Validators.required, Validators.min(0)]]
  });

  // ── Actions ────────────────────────────────────────────
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    this.success.set(null);
    this.error.set(null);
    this.submitting.set(true);

    const payload = this.form.getRawValue() as Credit;

    this.api.create(payload)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.success.set('Crédit créé avec succès.');
          this.form.reset({ repaymentType: 'MENSUALITE_CONSTANTE', status: 'PENDING', dependents: 0 });
        },
        error: (err) => {
          if (err?.name === 'TimeoutError') {
            this.error.set('Le serveur met trop de temps à répondre. Vérifiez que le backend est bien lancé.');
          } else {
            this.error.set(err?.error?.message ?? 'Erreur lors de la création du crédit.');
          }
        }
      });
  }
}
