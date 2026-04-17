import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Attache automatiquement le token JWT à chaque requête HTTP sortante.
 * Compatible Angular standalone (HttpInterceptorFn).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  if (token) {
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(cloned);
  }

  return next(req);
};
