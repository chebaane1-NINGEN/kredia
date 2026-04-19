import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { ChatbotVm } from '../../vm/chatbot.vm';
import { ChatbotRecommendation } from '../../models/chatbot.model';
import { AuthService } from '../../../../../core/services/auth.service';
import { CreditVm } from '../../../Credit/vm/credit.vm';
import { EcheanceVm } from '../../../Echeance/vm/echeance.vm';
import { Credit } from '../../../Credit/models/credit.model';
import { EcheancePaymentResponse } from '../../../Echeance/models/echeance.model';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './chatbot-page.component.html',
  styleUrl: './chatbot-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatbotPageComponent {
  private readonly vm         = inject(ChatbotVm);
  private readonly cdr        = inject(ChangeDetectorRef);
  private readonly fb         = inject(FormBuilder);

  // ── État UI ────────────────────────────────────────────
  loading = false;
  error: string | null = null;
  response: ChatbotRecommendation | null = null;

  readonly form = this.fb.nonNullable.group({
    description: ['', [Validators.required, Validators.minLength(10)]]
  });

  // ── Actions ────────────────────────────────────────────
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Ajoutez une description plus détaillée.';
      this.cdr.markForCheck();
      return;
    }

    this.error    = null;
    this.response = null;
    this.loading  = true;
    this.cdr.markForCheck();

    const { description } = this.form.getRawValue();

    this.vm.recommendRepayment(description)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (res) => {
          if (res?.error) { this.error = res.error; }
          else            { this.response = res;    }
          this.cdr.markForCheck();
        },
        error: () => {
          this.error = 'Erreur lors de la demande. Vérifiez le backend et le CORS.';
          this.cdr.markForCheck();
        }
      });
  }
}
