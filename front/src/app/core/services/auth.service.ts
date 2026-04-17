import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../http/api.config';

export interface LoginRequest {
  email: string;
  password: string;
}

// Typage explicite — correspond à { success, data: { token }, timestamp }
export interface LoginResponse {
  success?: boolean;
  timestamp?: string;
  data?: {
    token?: string;
    accessToken?: string;
    access_token?: string;
    jwt?: string;
    [key: string]: any;
  };
  token?: string;
  accessToken?: string;
  access_token?: string;
  jwt?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http   = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly TOKEN_KEY = 'token';

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${API_BASE_URL}/api/auth/login`,
      credentials
    );
  }

  saveToken(response: LoginResponse): boolean {
    // Cherche dans response.data d'abord, puis à la racine
    const token =
      response?.data?.token ??
      response?.data?.accessToken ??
      response?.data?.access_token ??
      response?.data?.jwt ??
      response?.token ??
      response?.accessToken ??
      response?.access_token ??
      response?.jwt;

    if (token) {
      localStorage.setItem(this.TOKEN_KEY, token);
      return true;
    }
    return false;
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
