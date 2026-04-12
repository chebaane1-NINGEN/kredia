import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { ChatbotApi } from '../../data-access/chatbot.api';
import { ChatbotRecommendation } from '../../models/chatbot.model';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './chatbot-page.component.html',
  styleUrl: './chatbot-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatbotPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ChatbotApi);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  error: string | null = null;
  response: ChatbotRecommendation | null = null;

  readonly form = this.fb.nonNullable.group({
    description: ['', [Validators.required, Validators.minLength(10)]]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Ajoutez une description plus detaillee.';
      this.cdr.markForCheck();
      return;
    }

    this.error = null;
    this.response = null;
    this.loading = true;
    this.cdr.markForCheck();

    const { description } = this.form.getRawValue();

    const timeoutId = setTimeout(() => {
      if (this.loading) {
        this.loading = false;
        this.error = 'Aucune reponse du serveur. Verifiez que le backend est bien lance.';
        this.cdr.markForCheck();
      }
    }, 12000);

    this.api
      .recommendRepayment(description)
      .pipe(
        finalize(() => {
          clearTimeout(timeoutId);
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (res) => {
          if (res?.error) {
            this.error = res.error;
          } else {
            this.response = res;
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.error = 'Erreur lors de la demande. Verifiez le backend et le CORS.';
          this.cdr.markForCheck();
        }
      });
  }
}
