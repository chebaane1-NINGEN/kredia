import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div 
          [ngClass]="['toast', 'toast--' + toast.type]">
          <div class="toast__content">
            <span class="toast__icon">
              @switch(toast.type) {
                @case('success') {
                  ✓
                }
                @case('error') {
                  ✕
                }
                @case('warning') {
                  ⚠
                }
                @case('info') {
                  ℹ
                }
              }
            </span>
            <span class="toast__message">{{ toast.message }}</span>
          </div>
          <button 
            class="toast__close" 
            (click)="toastService.remove(toast.id)"
            aria-label="Fermer">
            ×
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 400px;
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 12px 24px rgba(15, 23, 42, 0.15);
      animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: auto;
      gap: 12px;
    }

    .toast--success {
      background: #f0fdf4;
      border: 1px solid #86efac;
      color: #166534;
    }

    .toast--error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }

    .toast--warning {
      background: #fffbf0;
      border: 1px solid #fed7aa;
      color: #92400e;
    }

    .toast--info {
      background: #eff6ff;
      border: 1px solid #bae6fd;
      color: #0c4a6e;
    }

    .toast__content {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
    }

    .toast__icon {
      font-size: 18px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .toast__message {
      word-break: break-word;
      line-height: 1.4;
    }

    .toast__close {
      background: transparent;
      border: 0;
      cursor: pointer;
      font-size: 20px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      flex-shrink: 0;
      opacity: 0.6;
      transition: opacity 0.2s;
      color: inherit;

      &:hover {
        opacity: 1;
      }
    }

    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(24px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @media (max-width: 640px) {
      .toast-container {
        bottom: 16px;
        right: 16px;
        left: 16px;
        max-width: none;
      }

      .toast {
        padding: 12px 14px;
        font-size: 13px;
      }
    }
  `]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}
