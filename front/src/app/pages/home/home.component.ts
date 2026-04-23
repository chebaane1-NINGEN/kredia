import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule, ViewportScroller } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly scroller = inject(ViewportScroller);

  contactSent = false;
  contactError = '';

  readonly contactForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    message: ['', [Validators.required, Validators.minLength(15)]]
  });

  readonly testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Entrepreneur',
      text: 'Kredia helped me secure a business loan in just 48 hours. The AI-powered credit scoring was incredibly accurate and transparent. Highly recommended!',
      initials: 'SJ',
      rating: 5
    },
    {
      name: 'Michel Dubois',
      role: 'Investment Manager',
      text: 'The investment portfolio analysis tools are exceptional. I\'ve increased my returns by 18% using Kredia\'s recommendations. Best fintech platform I\'ve used.',
      initials: 'MD',
      rating: 5
    },
    {
      name: 'Amira Patel',
      role: 'Financial Advisor',
      text: 'My clients love the intuitive interface and real-time insights. The AI coach feature is a game-changer for financial planning. Outstanding platform!',
      initials: 'AP',
      rating: 5
    },
    {
      name: 'James Wilson',
      role: 'Student',
      text: 'I improved my credit score by 120 points in 6 months using Kredia\'s guidance. The personalized recommendations were spot-on and easy to follow.',
      initials: 'JW',
      rating: 5
    },
    {
      name: 'Emma Chen',
      role: 'Small Business Owner',
      text: 'Managing multiple loans and investments is now effortless. Kredia\'s unified dashboard saved me hours every week. Worth every penny!',
      initials: 'EC',
      rating: 5
    },
    {
      name: 'David Martinez',
      role: 'Corporate Executive',
      text: 'Enterprise-grade security and compliance. I trusted Kredia with significant capital. The support team is responsive and knowledgeable. Top-tier service.',
      initials: 'DM',
      rating: 5
    }
  ];

  get controls() {
    return this.contactForm.controls;
  }

  get isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  get dashboardRoute(): string {
    return this.auth.isAdmin()
      ? '/admin'
      : this.auth.isAgent()
      ? '/agent/dashboard'
      : this.auth.isClient()
      ? '/credit/list'
      : '/login';
  }

  scrollToTop(event: Event): void {
    event.preventDefault();
    this.scroller.scrollToPosition([0, 0]);
  }

  scrollToSection(event: Event, sectionId: string): void {
    event.preventDefault();
    const element = document.querySelector(`#${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  navigateToDashboard(): void {
    this.router.navigateByUrl(this.dashboardRoute);
  }

  submitContact(): void {
    this.contactError = '';
    this.contactSent = false;

    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.contactSent = true;
    this.contactForm.reset();
  }
}
