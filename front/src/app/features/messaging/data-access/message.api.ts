import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/http/api.config';
import { ApiResponse } from '../../admin/models/admin.model';

export interface DirectMessage {
  id?: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt?: string;
  read: boolean;
}

@Injectable({ providedIn: 'root' })
export class MessageApi {
  constructor(private readonly http: HttpClient) {}

  getConversation(userId: number): Observable<DirectMessage[]> {
    return this.http.get<ApiResponse<DirectMessage[]>>(`${API_BASE_URL}/api/messages/${userId}`).pipe(
      map(res => res.data)
    );
  }

  sendMessage(userId: number, content: string): Observable<DirectMessage> {
    return this.http.post<ApiResponse<DirectMessage>>(`${API_BASE_URL}/api/messages/${userId}`, content).pipe(
      map(res => res.data)
    );
  }

  getUnreadMessages(): Observable<DirectMessage[]> {
    return this.http.get<ApiResponse<DirectMessage[]>>(`${API_BASE_URL}/api/messages/unread`).pipe(
      map(res => res.data || [])
    );
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<ApiResponse<number>>(`${API_BASE_URL}/api/messages/unread/count`).pipe(
      map(res => res.data || 0)
    );
  }

  markConversationRead(userId: number): Observable<number> {
    return this.http.patch<ApiResponse<number>>(`${API_BASE_URL}/api/messages/${userId}/read`, {}).pipe(
      map(res => res.data || 0)
    );
  }
}
