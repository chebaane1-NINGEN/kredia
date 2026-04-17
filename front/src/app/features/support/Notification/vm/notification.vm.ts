import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationApi } from '../data-access/notification.api';
import { Notification } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationVm {
  private readonly api = inject(NotificationApi);

  findAll(): Observable<Notification[]> {
    return this.api.findAll();
  }

  findByUser(userId: number): Observable<Notification[]> {
    return this.api.findByUser(userId);
  }

  markAsRead(id: number): Observable<Notification> {
    return this.api.markAsRead(id);
  }
}
