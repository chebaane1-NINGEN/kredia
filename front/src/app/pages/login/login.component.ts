import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, LoginResponse } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb     = inject(FormBuilder);
  private readonly cdr    = inject(ChangeDetectorRef);
  private readonly zone   = inject(NgZone);

  loading = false;
  error: string | null = null;

  readonly form = this.fb.nonNullable.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.error   = null;
    this.cdr.markForCheck();

    this.auth.login(this.form.getRawValue()).subscribe({
      next: (response: LoginResponse) => {
        // 1. Sauvegarde le token immédiatement (synchrone)
        const saved = this.auth.saveToken(response);

        this.loading = false;
        this.cdr.markForCheck();

        if (saved) {
          this.zone.run(() => this.router.navigateByUrl('/credit/list'));
        } else {
          const data = (response as any)?.data;
          this.error = `Token introuvable. data = ${JSON.stringify(data)}`;
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        this.loading = false;
        this.error =
          err?.error?.message ??
          err?.error?.error ??
          (err?.status === 0
            ? 'Unable to reach the server.'
            : err?.status === 401
            ? 'Incorrect email or password.'
            : `Error ${err?.status ?? ''} — please try again.`);
        this.cdr.markForCheck();
      }
    });
  }
}
