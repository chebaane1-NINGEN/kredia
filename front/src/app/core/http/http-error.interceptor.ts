import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/**
 * Intercepte les erreurs HTTP globales.
 * - 401 : token expiré/invalide → supprime le token et redirige vers /login
 *   (sauf si c'est la requête de login elle-même)
 */
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isLoginRequest = req.url.includes('/api/auth/login');

      if (error.status === 401 && !isLoginRequest) {
        // Token expiré ou invalide — nettoyer et rediriger
        localStorage.removeItem('token');
        // Petit délai pour laisser le composant afficher un message si besoin
        setTimeout(() => { window.location.href = '/login'; }, 100);
      }
      return throwError(() => error);
    })
  );
};
