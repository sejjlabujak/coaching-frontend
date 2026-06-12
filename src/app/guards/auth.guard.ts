import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Blocks unauthenticated users and redirects first-time coaches to change-password. */
export const authGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  const user = auth.currentUser();
  if (user?.mustChangePassword && user.role === 'COACH' && route.routeConfig?.path !== 'change-password') {
    router.navigate(['/change-password']);
    return false;
  }

  return true;
};
