import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith(environment.apiUrl)) {
    const csrfToken = inject(AuthService).getCsrfToken();
    const stateChanging = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
    req = req.clone({
      withCredentials: true,
      setHeaders: stateChanging && csrfToken ? { 'X-XSRF-TOKEN': csrfToken } : {},
    });
  }
  return next(req);
};
