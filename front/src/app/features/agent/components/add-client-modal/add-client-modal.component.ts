import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-add-client-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" [@fadeInOut]>
      <div class="modal-container" [@slideInOut]>
        <div class="modal-header">
          <h2>Add New Client</h2>
          <button class="close-btn" (click)="onClose()" type="button">×</button>
        </div>

        <form [formGroup]="form" class="modal-form">
          <div class="form-group">
            <label for="firstName">First Name</label>
            <input 
              id="firstName" 
              type="text" 
              formControlName="firstName"
              placeholder="John"
              class="form-control"
              [class.error]="isFieldInvalid('firstName')"
            />
            <span class="error-msg" *ngIf="isFieldInvalid('firstName')">
              First name is required
            </span>
          </div>

          <div class="form-group">
            <label for="lastName">Last Name</label>
            <input 
              id="lastName" 
              type="text" 
              formControlName="lastName"
              placeholder="Doe"
              class="form-control"
              [class.error]="isFieldInvalid('lastName')"
            />
            <span class="error-msg" *ngIf="isFieldInvalid('lastName')">
              Last name is required
            </span>
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input 
              id="email" 
              type="email" 
              formControlName="email"
              placeholder="john@example.com"
              class="form-control"
              [class.error]="isFieldInvalid('email')"
            />
            <span class="error-msg" *ngIf="isFieldInvalid('email')">
              Valid email is required
            </span>
          </div>

          <div class="form-group">
            <label for="phoneNumber">Phone Number</label>
            <input 
              id="phoneNumber" 
              type="tel" 
              formControlName="phoneNumber"
              placeholder="+1 (555) 000-0000"
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label for="status">Status</label>
            <select formControlName="status" class="form-control">
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="PENDING_VERIFICATION">Pending Verification</option>
            </select>
          </div>

          <div class="form-group">
            <label for="notes">Notes</label>
            <textarea 
              id="notes" 
              formControlName="notes"
              placeholder="Add any notes about this client..."
              class="form-control"
              rows="3"
            ></textarea>
          </div>
        </form>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="onClose()" [disabled]="isLoading">
            Cancel
          </button>
          <button 
            class="btn btn-primary" 
            (click)="onSubmit()" 
            [disabled]="!form.valid || isLoading"
          >
            <span *ngIf="!isLoading">Add Client</span>
            <span *ngIf="isLoading">
              <span class="spinner"></span> Creating...
            </span>
          </button>
        </div>

        <div class="error-alert" *ngIf="error">
          <span class="error-icon">⚠️</span>
          {{ error }}
        </div>
      </div>
    </div>
  `,
  styleUrl: './add-client-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-out', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateY(-50px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateY(-50px)', opacity: 0 }))
      ])
    ])
  ]
})
export class AddClientModalComponent {
  @Input() isOpen = false;
  @Input() isLoading = false;
  @Input() error: string | null = null;
  @Output() submit = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', []],
      status: ['ACTIVE'],
      notes: ['']
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onClose(): void {
    this.close.emit();
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.submit.emit(this.form.value);
    }
  }
}
