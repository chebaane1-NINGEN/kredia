import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../http/api.config';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

export interface LoginResponse {
  success?: boolean;
  message?: string;
  timestamp?: string;
  data?: {
    user?: {
      userId?: number;
      email?: string;
      role?: string;
      firstName?: string;
      lastName?: string;
    };
    token?: string;
    type?: string;
    accessToken?: string;
    access_token?: string;
    jwt?: string;
  };
  user?: any;
  token?: string;
  type?: string;
  role?: string;
  accessToken?: string;
  access_token?: string;
  jwt?: string;
}

/** Payload JWT décodé */
export interface JwtPayload {
  sub: string;  // userId (string depuis JWT)
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  iat: number;
  exp: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly TOKEN_KEY = 'token';
  private readonly USER_KEY = 'user';

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_BASE_URL}/api/auth/login`, credentials);
  }

  register(credentials: RegisterRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${API_BASE_URL}/api/auth/register`, credentials);
  }

  forgotPassword(email: string): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${API_BASE_URL}/api/auth/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${API_BASE_URL}/api/auth/reset-password`, {
      token,
      password
    });
  }

  saveToken(response: LoginResponse): boolean {
    const token =
      response?.data?.token ??
      response?.data?.accessToken ??
      response?.data?.access_token ??
      response?.data?.jwt ??
      response?.token ??
      response?.accessToken ??
      response?.access_token ??
      response?.jwt;

    const saved = this.saveTokenFromString(token ?? '');
    if (!saved) {
      return false;
    }

    const user = response?.data?.user ?? response?.user;
    if (user) {
      try {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      } catch {
        // ignore storage failures, token is the primary session key
      }
    }

    return true;
  }

  saveTokenFromString(token: string): boolean {
    if (!token) {
      return false;
    }
    localStorage.setItem(this.TOKEN_KEY, token);
    return true;
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): any | null {
    const json = localStorage.getItem(this.USER_KEY);
    if (!json) return null;
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private decodeBase64Url(payload: string): string {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - base64.length % 4) % 4), '=');
    return atob(padded);
  }

  decodeToken(): JwtPayload | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const json = this.decodeBase64Url(parts[1]);
      return JSON.parse(json) as JwtPayload;
    } catch {
      return null;
    }
  }

  getCurrentUserId(): number | null {
    const payload = this.decodeToken();
    if (!payload?.sub) return null;
    const id = parseInt(payload.sub, 10);
    return isNaN(id) ? null : id;
  }

  getCurrentUserRole(): string | null {
    return this.decodeToken()?.role ?? null;
  }

  getCurrentUserEmail(): string | null {
    return this.decodeToken()?.email ?? null;
  }

  getCurrentUserFirstName(): string | null {
    return this.decodeToken()?.firstName ?? null;
  }

  getCurrentUserLastName(): string | null {
    return this.decodeToken()?.lastName ?? null;
  }

  isClient(): boolean {
    return this.getCurrentUserRole() === 'CLIENT';
  }

  isAgent(): boolean {
    return this.getCurrentUserRole() === 'AGENT';
  }

  isAdmin(): boolean {
    const role = this.getCurrentUserRole();
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
  }

  getDashboardRoute(): string {
    if (this.isAdmin()) return '/admin/analytics';
    if (this.isAgent()) return '/agent/dashboard';
    if (this.isClient()) return '/user/profile';
    return '/home';
  }
}
