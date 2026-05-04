import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/**
 * Intercepte les erreurs HTTP globales.
 * - 401 : token expiré → supprime le token et redirige vers /login
 *   (sauf si c'est la requête de login elle-même)
 */
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isLoginRequest = req.url.includes('/api/auth/login');

      if (error.status === 401 && !isLoginRequest) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return throwError(() => error);
    })
  );
};
