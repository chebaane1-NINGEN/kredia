import { inject } from '@angular/core';
import { CanActivateFn, CanActivateChildFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

const checkAuth = (state?: RouterStateSnapshot): boolean => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const url = state?.url ?? '';

  // Check admin routes
  if (url.startsWith('/admin') && !auth.isAdmin()) {
    router.navigate(['/']);
    return false;
  }

  // Check agent routes
  if (url.startsWith('/agent') && !auth.isAgent()) {
    router.navigate(['/']);
    return false;
  }

  // Check client routes
  if (url.startsWith('/client') && !auth.isClient()) {
    router.navigate(['/']);
    return false;
  }

  return true;
};

export const authGuard: CanActivateFn = (_, state) => checkAuth(state);
export const authChildGuard: CanActivateChildFn = (_, state) => checkAuth(state);
