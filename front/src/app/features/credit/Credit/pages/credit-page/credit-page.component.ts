import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { CreditApi } from '../../data-access/credit.api';
import { Credit } from '../../models/credit.model';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './credit-page.component.html',
  styleUrl: './credit-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreditPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CreditApi);
  private readonly cdr = inject(ChangeDetectorRef);

  submitting = false;
  success: string | null = null;
  error: string | null = null;

  readonly repaymentTypes = [
    { value: 'AMORTISSEMENT_CONSTANT', label: 'Amortissement constant' },
    { value: 'MENSUALITE_CONSTANTE', label: 'Mensualite constante' },
    { value: 'IN_FINE', label: 'In fine' }
  ];

  readonly statuses = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'DEFAULTED', label: 'Defaulted' }
  ];

  readonly form = this.fb.nonNullable.group({
    userId: [0, [Validators.required, Validators.min(1)]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    interestRate: [0, [Validators.required, Validators.min(0.01)]],
    termMonths: [0, [Validators.required, Validators.min(1)]],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    repaymentType: ['MENSUALITE_CONSTANTE', Validators.required],
    status: ['PENDING', Validators.required],
    income: [0, [Validators.required, Validators.min(0)]],
    dependents: [0, [Validators.required, Validators.min(0)]]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Veuillez remplir tous les champs obligatoires.';
      this.cdr.markForCheck();
      return;
    }

    this.success = null;
    this.error = null;
    this.submitting = true;
    this.cdr.markForCheck();

    const payload = this.form.getRawValue() as Credit;
    console.log('Submitting credit payload', payload);

    const timeoutId = setTimeout(() => {
      if (this.submitting) {
        this.submitting = false;
        this.error = 'Aucune r�ponse du serveur. V�rifiez que le backend est bien lanc�.';
        this.cdr.markForCheck();
      }
    }, 12000);

    this.api
      .create(payload)
      .pipe(
        finalize(() => {
          clearTimeout(timeoutId);
          this.submitting = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.success = 'Cr�dit cr�� avec succ�s.';
          this.form.reset({
            repaymentType: 'MENSUALITE_CONSTANTE',
            status: 'PENDING',
            dependents: 0
          });
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Credit create failed', err);
          if (err?.name === 'TimeoutError') {
            this.error = 'Le serveur met trop de temps � r�pondre. V�rifiez que le backend est bien lanc�.';
          } else {
            this.error =
              err?.error?.message ?? 'Erreur lors de la cr�ation du cr�dit. V�rifiez le backend et le CORS.';
          }
          this.cdr.markForCheck();
        }
      });
  }
}
