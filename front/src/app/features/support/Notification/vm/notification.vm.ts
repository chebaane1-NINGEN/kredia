import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationApi } from '../data-access/notification.api';
import { Notification, NotificationCreateRequest, NotificationPage } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationVm {
  private readonly api = inject(NotificationApi);

  create(request: NotificationCreateRequest): Observable<Notification> {
    return this.api.create(request);
  }

  findByUser(userId: number, isRead: boolean | null = null, page = 0, size = 10): Observable<NotificationPage> {
    return this.api.findByUser(userId, isRead, page, size);
  }

  markAsRead(id: number): Observable<Notification> {
    return this.api.markAsRead(id);
  }

  delete(id: number): Observable<void> {
    return this.api.delete(id);
  }
}
