import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, ElementRef, HostListener, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, finalize, forkJoin, interval, map, of, startWith, switchMap } from 'rxjs';
import { DarkModeService } from '../../services/dark-mode.service';
import { AuthService } from '../../services/auth.service';
import { Notification } from '../../../features/support/Notification/models/notification.model';
import { NotificationVm } from '../../../features/support/Notification/vm/notification.vm';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly notificationVm = inject(NotificationVm);
  readonly darkModeService = inject(DarkModeService);

  readonly notificationPreviewSize = 30;

  notifications: Notification[] = [];
  notificationsOpen = false;
  hasUnreadNotifications = false;
  loadingNotifications = false;
  notificationsError: string | null = null;
  deletingNotificationId: number | null = null;

  ngOnInit(): void {
    const userId = this.currentUserId;
    if (!userId) {
      return;
    }

    interval(30000)
      .pipe(
        startWith(0),
        switchMap(() => this.notificationVm.findByUser(userId, false, 0, 1).pipe(
          map((page) => (page.totalElements ?? page.content?.length ?? 0) > 0),
          catchError(() => of(false))
        )),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((hasUnread) => {
        this.hasUnreadNotifications = hasUnread;
        if (this.notificationsOpen) {
          this.loadNotifications(false, true);
        }
        this.cdr.markForCheck();
      });
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get currentUserId(): number | null {
    return this.authService.getCurrentUserId();
  }

  toggleDarkMode() {
    this.darkModeService.toggleDarkMode();
  }

  toggleNotifications(event: MouseEvent): void {
    event.stopPropagation();

    if (!this.currentUserId) {
      return;
    }

    this.notificationsOpen = !this.notificationsOpen;
    this.notificationsError = null;

    if (this.notificationsOpen) {
      this.loadNotifications(true);
    }

    this.cdr.markForCheck();
  }

  refreshNotifications(event?: MouseEvent): void {
    event?.stopPropagation();
    if (!this.currentUserId) {
      return;
    }

    this.loadNotifications(this.notificationsOpen);
  }

  openNotification(notification: Notification): void {
    this.notificationsOpen = false;
    this.cdr.markForCheck();
    void this.router.navigate(
      ['/support/reclamations'],
      notification.reclamationId ? { queryParams: { focus: notification.reclamationId } } : undefined
    );
  }

  removeNotification(notification: Notification, event: MouseEvent): void {
    event.stopPropagation();

    const notificationId = notification.notificationId;
    if (!notificationId || this.deletingNotificationId === notificationId) {
      return;
    }

    this.deletingNotificationId = notificationId;
    this.cdr.markForCheck();

    this.notificationVm.delete(notificationId)
      .pipe(finalize(() => {
        this.deletingNotificationId = null;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.notifications = this.notifications.filter((item) => item.notificationId !== notificationId);
          this.hasUnreadNotifications = this.notifications.some((item) => !item.isRead);
          this.cdr.markForCheck();
        },
        error: () => {
          this.notificationsError = 'Impossible de supprimer cette notification pour le moment.';
          this.cdr.markForCheck();
        }
      });
  }

  trackNotification(_: number, notification: Notification): number {
    return notification.notificationId ?? 0;
  }

  notificationHeading(notification: Notification): string {
    switch (notification.title) {
      case 'Complaint received':
        return 'Reclamation recue';
      case 'Complaint status updated':
        return 'Statut mis a jour';
      case 'Assigned complaint update':
        return 'Ticket assigne mis a jour';
      case 'Escalation alert':
        return 'Escalade prioritaire';
      case 'Complaint escalated':
        return 'Escalade en cours';
      case 'Internal note added':
        return 'Nouvelle note interne';
      case 'Customer replied':
        return 'Nouveau message client';
      case 'New response on your complaint':
        return 'Nouvelle reponse support';
      case 'Customer feedback received':
        return 'Feedback client recu';
      default:
        return this.cleanNotificationText(notification.title, 'Notification support');
    }
  }

  notificationBody(notification: Notification): string {
    switch (notification.title) {
      case 'Complaint received':
        return notification.type === 'EMAIL'
          ? 'Une confirmation email vient d etre envoyee pour votre demande support.'
          : 'Votre demande support a bien ete recue et sera prise en charge rapidement.';
      case 'Complaint status updated':
        return this.cleanNotificationText(notification.message, 'Le statut de votre demande support a ete mis a jour.');
      case 'Assigned complaint update':
        return 'Le dossier assigne a votre equipe vient de changer de statut.';
      case 'Escalation alert':
        return 'Une situation sensible vient de remonter en priorite et requiert une attention immediate.';
      case 'Complaint escalated':
        return 'Ce dossier a ete remonte en priorite pour traitement rapide.';
      case 'Internal note added':
        return 'Une nouvelle note interne a ete ajoutee a ce dossier.';
      case 'Customer replied':
        return 'Le client a ajoute un nouveau message sur ce dossier.';
      case 'New response on your complaint':
        return 'Notre equipe support vient de vous repondre.';
      case 'Customer feedback received':
        return 'Un nouvel avis client a ete recu apres resolution.';
      default:
        return this.cleanNotificationText(notification.message, 'Consultez ce dossier pour voir la derniere mise a jour.');
    }
  }

  notificationTypeLabel(type: Notification['type']): string {
    switch (type) {
      case 'EMAIL':
        return 'Email';
      case 'SMS':
        return 'SMS';
      default:
        return 'Push';
    }
  }

  formatNotificationTime(sentAt?: string): string {
    if (!sentAt) {
      return 'A l\'instant';
    }

    const sentDate = new Date(sentAt);
    if (Number.isNaN(sentDate.getTime())) {
      return 'Recemment';
    }

    const diffMs = Date.now() - sentDate.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes <= 0) {
      return 'A l\'instant';
    }

    if (diffMinutes < 60) {
      return `Il y a ${diffMinutes} min`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `Il y a ${diffHours} h`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) {
      return 'Hier';
    }

    if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(sentDate);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.notificationsOpen) {
      return;
    }

    const target = event.target;
    if (target instanceof Node && !this.elementRef.nativeElement.contains(target)) {
      this.notificationsOpen = false;
      this.cdr.markForCheck();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.notificationsOpen) {
      return;
    }

    this.notificationsOpen = false;
    this.cdr.markForCheck();
  }

  private loadNotifications(markViewedAsRead: boolean, silent = false): void {
    const userId = this.currentUserId;
    if (!userId) {
      return;
    }

    if (!silent) {
      this.loadingNotifications = true;
    }
    this.notificationsError = null;
    this.cdr.markForCheck();

    this.notificationVm.findByUser(userId, null, 0, this.notificationPreviewSize)
      .pipe(finalize(() => {
        if (!silent) {
          this.loadingNotifications = false;
        }
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (page) => {
          this.notifications = page.content ?? [];
          this.hasUnreadNotifications = this.notifications.some((notification) => !notification.isRead);

          if (markViewedAsRead) {
            this.markVisibleNotificationsAsRead();
          }

          this.cdr.markForCheck();
        },
        error: () => {
          if (!silent) {
            this.notificationsError = 'Impossible de charger vos notifications pour le moment.';
          }
          this.cdr.markForCheck();
        }
      });
  }

  private markVisibleNotificationsAsRead(): void {
    const unreadIds = this.notifications
      .filter((notification) => !notification.isRead && notification.notificationId != null)
      .map((notification) => notification.notificationId as number);

    if (unreadIds.length === 0) {
      this.hasUnreadNotifications = false;
      this.cdr.markForCheck();
      return;
    }

    forkJoin(
      unreadIds.map((notificationId) =>
        this.notificationVm.markAsRead(notificationId).pipe(catchError(() => of(null)))
      )
    ).subscribe(() => {
      this.notifications = this.notifications.map((notification) =>
        unreadIds.includes(notification.notificationId ?? -1)
          ? { ...notification, isRead: true }
          : notification
      );
      this.hasUnreadNotifications = false;
      this.cdr.markForCheck();
    });
  }

  private cleanNotificationText(text: string | undefined, fallback: string): string {
    if (!text) {
      return fallback;
    }

    return text
      .replace(/complaint\s*#\d+/gi, 'your support request')
      .replace(/ticket\s*#\d+/gi, 'your support request')
      .replace(/reclamation\s*#\d+/gi, 'your support request')
      .replace(/#\d+/g, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/\s+([,.;:!?])/g, '$1')
      .trim() || fallback;
  }
}
