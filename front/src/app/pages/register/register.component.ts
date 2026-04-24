import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, LoginResponse } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  error: string | null = null;
  showPassword = false;
  showConfirmPassword = false;
  touched = { firstName: false, lastName: false, email: false, phoneNumber: false, password: false, confirmPassword: false };

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', [Validators.required, Validators.minLength(6)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
    agreeTerms: [false, [Validators.requiredTrue]]
  });

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  markFieldTouched(field: keyof typeof this.touched): void {
    this.touched[field] = true;
    this.cdr.markForCheck();
  }

  getFieldError(field: keyof typeof this.touched): string | null {
    const control = this.form.get(field);
    if (!control || !this.touched[field] || !control.errors) {
      return null;
    }

    if (field === 'firstName' || field === 'lastName') {
      if (control.hasError('required')) return `${field === 'firstName' ? 'First name' : 'Last name'} is required`;
      if (control.hasError('minlength')) return `${field === 'firstName' ? 'First name' : 'Last name'} must be at least 2 characters`;
    }

    if (field === 'email') {
      if (control.hasError('required')) return 'Email is required';
      if (control.hasError('email')) return 'Please enter a valid email';
    }

    if (field === 'phoneNumber') {
      if (control.hasError('required')) return 'Phone number is required';
      if (control.hasError('minlength')) return 'Phone number must be at least 6 characters';
    }

    if (field === 'password') {
      if (control.hasError('required')) return 'Password is required';
      if (control.hasError('minlength')) return 'Password must be at least 8 characters';
    }

    if (field === 'confirmPassword') {
      if (control.hasError('required')) return 'Please confirm your password';
    }

    return null;
  }

  isFieldValid(field: keyof typeof this.touched): boolean {
    const control = this.form.get(field);
    return this.touched[field] && control?.valid === true;
  }

  passwordsMatch(): boolean {
    const password = this.form.get('password')?.value;
    const confirmPassword = this.form.get('confirmPassword')?.value;
    return password === confirmPassword;
  }

  submit(): void {
    if (this.form.invalid || !this.passwordsMatch()) {
      this.touched = { 
        firstName: true, 
        lastName: true, 
        email: true, 
        phoneNumber: true, 
        password: true, 
        confirmPassword: true 
      };
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    const { confirmPassword, agreeTerms, ...registerData } = this.form.getRawValue();

    this.auth.register(registerData).subscribe({
      next: (response: LoginResponse) => {
        const saved = this.auth.saveToken(response);
        this.loading = false;

        if (!saved) {
          this.error = 'Token not found. Please try again.';
          this.cdr.markForCheck();
          return;
        }

        this.router.navigateByUrl('/user');
      },
      error: (err) => {
        this.loading = false;
        this.error =
          err?.error?.message ??
          err?.error?.error ??
          (err?.status === 0
            ? 'Unable to reach the server. Please check your connection.'
            : err?.status === 409
            ? 'Email already registered. Please sign in or use a different email.'
            : err?.status === 400
            ? err?.error?.message || 'Invalid registration data.'
            : `Error ${err?.status ?? 'unknown'} — please try again.`);
        this.cdr.markForCheck();
      }
    });
  }

  loginWithProvider(provider: 'google' | 'github'): void {
    this.loading = true;
    window.location.href = `/oauth2/authorization/${provider}`;
  }
}
