import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of, map, switchMap } from 'rxjs';
import { AuthUser, LoginResponse } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly SESSION_KEY = 'coachpro_session';
  private csrfToken: string | null = null;

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly _currentUser = signal<AuthUser | null>(this.loadSession());

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly isAdmin = computed(() => this._currentUser()?.role === 'ADMIN');
  readonly teamName = computed(() => this._currentUser()?.teamName ?? null);

  login(username: string, password: string): Observable<{ success: boolean; error?: string }> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/api/auth/login`, { username, password })
      .pipe(
        switchMap((res) => this.refreshCsrfToken().pipe(map(() => res))),
        tap((res) => {
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
  getTeams(): Observable<{ id: number; name: string }[]> { return this.http.get<{ id: number; name: string }[]>(`${environment.apiUrl}/api/auth/teams`); }
  register(payload: { firstName: string; lastName: string; email: string; password: string; passwordConfirmation: string; teamId: number | null }): Observable<{ success: boolean; error?: string }> { return this.http.post(`${environment.apiUrl}/api/auth/register`, payload).pipe(map(() => ({ success: true as const })), catchError(err => of({ success: false as const, error: err.error?.error ?? 'Could not create your account.' }))); }
  verifyEmail(email: string, code: string): Observable<{ success: boolean; error?: string }> { return this.http.post(`${environment.apiUrl}/api/auth/verify-email`, { email, code }).pipe(map(() => ({ success: true as const })), catchError(err => of({ success: false as const, error: err.error?.error ?? 'Verification failed.' }))); }
  resendVerification(email: string): Observable<{ success: boolean; error?: string }> { return this.http.post(`${environment.apiUrl}/api/auth/resend-verification`, { email }).pipe(map(() => ({ success: true as const })), catchError(err => of({ success: false as const, error: err.error?.error ?? 'Could not resend the code.' }))); }

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
      localStorage.removeItem(this.SESSION_KEY);
    }
    this.http.post(`${environment.apiUrl}/api/auth/logout`, {}).subscribe({ error: () => {} });
    this.router.navigate(['/login']);
  }

  getCsrfToken(): string | null {
    return this.csrfToken;
  }

  initialize(): Observable<void> {
    // Route extraction runs on Node during a production build. It must not make
    // a browser API request or wait for the deployed backend from that process.
    if (!this.isBrowser) return of(undefined);
    return this.refreshCsrfToken().pipe(catchError(() => of(undefined)));
  }

  private refreshCsrfToken(): Observable<void> {
    return this.http.get<{ token: string }>(`${environment.apiUrl}/api/auth/csrf`).pipe(
      tap((response) => this.csrfToken = response.token),
      map(() => undefined),
    );
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
