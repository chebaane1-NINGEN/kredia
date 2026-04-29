import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  autoClose?: boolean;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications$ = new BehaviorSubject<Notification[]>([]);
  public notifications = this.notifications$.asObservable();

  show(notification: Omit<Notification, 'id' | 'timestamp'>): void {
    const id = this.generateId();
    const fullNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      autoClose: notification.autoClose ?? true,
      duration: notification.duration ?? 5000
    };

    const current = this.notifications$.value;
    this.notifications$.next([...current, fullNotification]);

    // Auto-close après la durée spécifiée
    if (fullNotification.autoClose) {
      setTimeout(() => {
        this.remove(id);
      }, fullNotification.duration);
    }
  }

  success(title: string, message: string, duration = 5000): void {
    this.show({ type: 'success', title, message, duration });
  }

  error(title: string, message: string, duration = 7000): void {
    this.show({ type: 'error', title, message, duration });
  }

  warning(title: string, message: string, duration = 6000): void {
    this.show({ type: 'warning', title, message, duration });
  }

  info(title: string, message: string, duration = 5000): void {
    this.show({ type: 'info', title, message, duration });
  }

  remove(id: string): void {
    const current = this.notifications$.value;
    this.notifications$.next(current.filter(n => n.id !== id));
  }

  clear(): void {
    this.notifications$.next([]);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}