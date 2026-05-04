import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../core/http/api.config';
import { Notification, NotificationCreateRequest, NotificationPage } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationApi {
  private readonly baseUrl = `${API_BASE_URL}/api/notifications`;

  constructor(private readonly http: HttpClient) {}

  create(request: NotificationCreateRequest): Observable<Notification> {
    return this.http.post<Notification>(this.baseUrl, request);
  }

  findByUser(userId: number, isRead: boolean | null = null, page = 0, size = 10): Observable<NotificationPage> {
    const params: Record<string, string | number | boolean> = { page, size };
    if (isRead !== null) {
      params['isRead'] = isRead;
    }

    return this.http.get<NotificationPage>(`${this.baseUrl}/by-user/${userId}`, { params });
  }

  markAsRead(id: number): Observable<Notification> {
    return this.http.patch<Notification>(`${this.baseUrl}/${id}/read`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
