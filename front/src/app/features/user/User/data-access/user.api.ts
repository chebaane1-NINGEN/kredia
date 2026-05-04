import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../core/http/api.config';
import { User, UserStatus } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserApi {
  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<User[]> {
    return this.http.get<User[]>(`${API_BASE_URL}/api/users`);
  }

  findById(id: number): Observable<User> {
    return this.http.get<User>(`${API_BASE_URL}/api/users/${id}`);
  }

  updateStatus(id: number, status: UserStatus): Observable<User> {
    return this.http.patch<User>(`${API_BASE_URL}/api/users/${id}/status`, { status });
  }
}
