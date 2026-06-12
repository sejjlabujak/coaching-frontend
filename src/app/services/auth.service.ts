import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { AuthUser, LoginResponse } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'coachpro_token';
  private readonly SESSION_KEY = 'coachpro_session';

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly _currentUser = signal<AuthUser | null>(this.loadSession());

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly isAdmin = computed(() => this._currentUser()?.role === 'ADMIN');
  readonly isCoach = computed(() => this._currentUser()?.role === 'COACH');
  readonly teamName = computed(() => this._currentUser()?.teamName ?? null);

  login(username: string, password: string): Observable<{ success: boolean; error?: string }> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/api/auth/login`, { username, password })
      .pipe(
        tap((res) => {
          this.saveToken(res.token);
          const user: AuthUser = {
            username,
            role: res.role,
            mustChangePassword: res.mustChangePassword,
            teamName: res.teamName,
          };
          this._currentUser.set(user);
          this.saveSession(user);
        }),
        map(() => ({ success: true as const })),
        catchError((err) => {
          const msg = err.error?.error ?? 'Invalid username or password.';
          return of({ success: false as const, error: msg });
        }),
      );
  }

  changePassword(
    username: string,
    oldPassword: string,
    newPassword: string,
  ): Observable<{ success: boolean; error?: string }> {
    return this.http
      .post<{ message: string }>(`${environment.apiUrl}/api/auth/change-password`, {
        username,
        oldPassword,
        newPassword,
      })
      .pipe(
        tap(() => {
          const current = this._currentUser();
          if (current) {
            const updated: AuthUser = { ...current, mustChangePassword: false };
            this._currentUser.set(updated);
            this.saveSession(updated);
          }
        }),
        map(() => ({ success: true as const })),
        catchError((err) => {
          const msg = err.error?.error ?? 'Failed to change password.';
          return of({ success: false as const, error: msg });
        }),
      );
  }

  logout(): void {
    this._currentUser.set(null);
    if (this.isBrowser) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.SESSION_KEY);
    }
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private saveToken(token: string): void {
    if (this.isBrowser) localStorage.setItem(this.TOKEN_KEY, token);
  }

  private loadSession(): AuthUser | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(this.SESSION_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }

  private saveSession(user: AuthUser): void {
    if (this.isBrowser) localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
  }
}
