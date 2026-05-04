import { inject } from '@angular/core';
import { CanActivateFn, CanActivateChildFn, Router } from '@angular/router';
import { AppRole, AuthService } from '../services/auth.service';

const checkAuth = (): boolean => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

const hasRouteRole = (roles: AppRole[] | undefined): boolean => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  if (!roles || roles.length === 0 || auth.hasAnyRole(...roles)) {
    return true;
  }

  router.navigate(['/home']);
  return false;
};

export const authGuard: CanActivateFn           = () => checkAuth();
export const authChildGuard: CanActivateChildFn = () => checkAuth();
export const roleGuard: CanActivateFn = (route) => hasRouteRole(route.data?.['roles'] as AppRole[] | undefined);
export const roleChildGuard: CanActivateChildFn = (route) => hasRouteRole(route.data?.['roles'] as AppRole[] | undefined);
