import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith(environment.apiUrl)) {
    const csrfToken = readCsrfCookie() ?? inject(AuthService).getCsrfToken();
    const stateChanging = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
    req = req.clone({
      withCredentials: true,
      setHeaders: stateChanging && csrfToken ? { 'X-XSRF-TOKEN': csrfToken } : {},
    });
  }
  return next(req);
};

function readCsrfCookie(): string | null {
  if (typeof document === 'undefined') return null;

  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith('XSRF-TOKEN='));

  return cookie ? decodeURIComponent(cookie.substring('XSRF-TOKEN='.length)) : null;
}
