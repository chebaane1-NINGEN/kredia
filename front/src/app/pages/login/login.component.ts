import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { API_BASE_URL } from '../../core/http/api.config';
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
  showPassword = false;
  touched = { email: false, password: false };

  readonly form = this.fb.nonNullable.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]]
  });

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  markFieldTouched(field: 'email' | 'password'): void {
    this.touched[field] = true;
    this.cdr.markForCheck();
  }

  getFieldError(field: 'email' | 'password'): string | null {
    const control = this.form.get(field);
    if (!control || !this.touched[field] || !control.errors) {
      return null;
    }

    if (field === 'email') {
      if (control.hasError('required')) return 'Email is required';
      if (control.hasError('email')) return 'Please enter a valid email';
    }

    if (field === 'password') {
      if (control.hasError('required')) return 'Password is required';
      if (control.hasError('minlength')) return 'Password must be at least 4 characters';
    }

    return null;
  }

  isFieldValid(field: 'email' | 'password'): boolean {
    const control = this.form.get(field);
    return this.touched[field] && control?.valid === true;
  }

  submit(): void {
    if (this.form.invalid) {
      this.touched = { email: true, password: true };
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.error   = null;
    this.cdr.markForCheck();

    this.auth.login(this.form.getRawValue()).subscribe({
      next: (response: LoginResponse) => {
        const saved = this.auth.saveToken(response);
        this.loading = false;

        if (!saved) {
          this.error = 'Token not found. Please try again.';
          this.cdr.markForCheck();
          return;
        }

        this.navigateAfterLogin();
      },
      error: (err) => {
        this.loading = false;
        this.error =
          err?.error?.message ??
          err?.error?.error ??
          (err?.status === 0
            ? 'Unable to reach the server. Please check your connection.'
            : err?.status === 401
            ? 'Invalid email or password.'
            : err?.status === 403
            ? 'CORS blocked. Backend server may not be configured properly.'
            : `Error ${err?.status ?? 'unknown'} — please try again.`);
        this.cdr.markForCheck();
      }
    });
  }

  loginWithProvider(provider: 'google' | 'github'): void {
    this.loading = true;
    window.location.href = `${API_BASE_URL}/oauth2/authorization/${provider}`;
  }

  private navigateAfterLogin(): void {
    const next = this.auth.isAdmin()
      ? '/admin'
      : this.auth.isAgent()
      ? '/agent/dashboard'
      : this.auth.isClient()
      ? '/credit/list'
      : '/user';

    this.zone.run(() => this.router.navigateByUrl(next));
  }
}
