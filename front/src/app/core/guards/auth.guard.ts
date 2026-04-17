import { inject } from '@angular/core';
import { CanActivateFn, CanActivateChildFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

const checkAuth = (): boolean => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

export const authGuard: CanActivateFn           = () => checkAuth();
export const authChildGuard: CanActivateChildFn = () => checkAuth();
