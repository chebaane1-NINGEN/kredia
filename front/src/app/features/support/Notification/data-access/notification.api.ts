import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../core/http/api.config';
import { Notification } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationApi {
  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${API_BASE_URL}/api/notifications`);
  }

  findByUser(userId: number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${API_BASE_URL}/api/notifications/user/${userId}`);
  }

  markAsRead(id: number): Observable<Notification> {
    return this.http.patch<Notification>(`${API_BASE_URL}/api/notifications/${id}/read`, {});
  }
}
