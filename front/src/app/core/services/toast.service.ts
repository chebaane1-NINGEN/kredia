import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);
  private idCounter = 0;
  private readonly DEFAULT_DURATION = 4000; // 4 secondes

  show(message: string, type: ToastType = 'info', duration: number = this.DEFAULT_DURATION): string {
    const id = `toast-${++this.idCounter}`;
    const toast: Toast = { id, message, type, duration };

    // Ajouter le toast
    this.toasts.update(toasts => [...toasts, toast]);

    // Auto-retrait après duration
    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }

    return id;
  }

  success(message: string, duration?: number): string {
    return this.show(message, 'success', duration);
  }

  error(message: string, duration?: number): string {
    return this.show(message, 'error', duration ?? 5000); // Plus long pour les erreurs
  }

  info(message: string, duration?: number): string {
    return this.show(message, 'info', duration);
  }

  warning(message: string, duration?: number): string {
    return this.show(message, 'warning', duration ?? 4500);
  }

  remove(id: string): void {
    this.toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }
}
