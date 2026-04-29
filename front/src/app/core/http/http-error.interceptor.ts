import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError, retry, timer } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../services/notification.service';

/**
 * Intercepte les erreurs HTTP globales avec gestion améliorée.
 * - 401 : token expiré → supprime le token et redirige vers /login
 * - 403 : accès refusé → message d'erreur
 * - 404 : ressource non trouvée → message d'erreur
 * - 500 : erreur serveur → message d'erreur avec retry
 * - Retry automatique pour les erreurs temporaires
 * - Messages d'erreur user-friendly via notifications
 */
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    // Retry pour les erreurs temporaires (5xx)
    retry({
      count: 2,
      delay: (error, retryCount) => {
        if (error instanceof HttpErrorResponse && error.status >= 500) {
          console.warn(`HTTP ${error.status} - Tentative ${retryCount}/2 dans 1s`);
          return timer(1000);
        }
        return throwError(() => error);
      }
    }),
    catchError((error: HttpErrorResponse) => {
      const isLoginRequest = req.url.includes('/api/auth/login');

      // Gestion des erreurs d'authentification
      if (error.status === 401 && !isLoginRequest) {
        console.warn('Token expiré, redirection vers login');
        notificationService.warning('Session expirée', 'Veuillez vous reconnecter.');
        localStorage.removeItem('token');
        router.navigate(['/login']);
        return throwError(() => new Error('Session expirée. Veuillez vous reconnecter.'));
      }

      // Gestion des erreurs d'autorisation
      if (error.status === 403) {
        const errorMessage = error.error?.message || 'Accès refusé. Vous n\'avez pas les permissions nécessaires.';
        notificationService.error('Accès refusé', errorMessage);
        return throwError(() => new Error(errorMessage));
      }

      // Gestion des ressources non trouvées
      if (error.status === 404) {
        const errorMessage = error.error?.message || 'Ressource non trouvée.';
        notificationService.warning('Ressource introuvable', errorMessage);
        return throwError(() => new Error(errorMessage));
      }

      // Gestion des erreurs de validation (400)
      if (error.status === 400) {
        const errorMessage = error.error?.message || 'Données invalides. Veuillez vérifier vos informations.';
        notificationService.warning('Données invalides', errorMessage);
        return throwError(() => new Error(errorMessage));
      }

      // Gestion des erreurs serveur
      if (error.status >= 500) {
        const errorMessage = error.error?.message || 'Erreur serveur. Veuillez réessayer plus tard.';
        notificationService.error('Erreur serveur', errorMessage);
        return throwError(() => new Error(errorMessage));
      }

      // Erreur réseau ou autre
      if (!error.status) {
        notificationService.error('Connexion perdue', 'Vérifiez votre connexion internet.');
        return throwError(() => new Error('Problème de connexion. Vérifiez votre connexion internet.'));
      }

      // Erreur par défaut
      const defaultMessage = error.error?.message || 'Une erreur inattendue s\'est produite.';
      notificationService.error('Erreur', defaultMessage);
      return throwError(() => new Error(defaultMessage));
    })
  );
};
