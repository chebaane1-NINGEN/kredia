import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../../core/services/auth.service';
import { Notification, NotificationCreateRequest, NotificationType } from '../../models/notification.model';
import { NotificationVm } from '../../vm/notification.vm';

type ReadFilter = 'ALL' | 'READ' | 'UNREAD';

@Component({
  selector: 'app-notification-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notification-page.component.html',
  styleUrl: './notification-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationPageComponent implements OnInit {
  private readonly vm = inject(NotificationVm);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly auth = inject(AuthService);

  readonly types: NotificationType[] = ['PUSH', 'EMAIL', 'SMS'];

  userId = this.auth.getCurrentUserId() ?? 0;
  readFilter: ReadFilter = 'ALL';
  page = 0;
  size = 10;
  totalPages = 0;
  totalElements = 0;
  notifications: Notification[] = [];
  loading = false;
  actionLoading = false;
  error: string | null = null;
  success: string | null = null;

  draft: NotificationCreateRequest = {
    userId: this.auth.getCurrentUserId() ?? 0,
    reclamationId: null,
    type: 'PUSH',
    title: '',
    message: ''
  };

  ngOnInit(): void {
    if (this.auth.isClient()) {
      this.userId = this.auth.getCurrentUserId() ?? 0;
      this.draft.userId = this.userId;
    }
    this.loadNotifications(true);
  }

  loadNotifications(resetPage = false): void {
    if (resetPage) {
      this.page = 0;
    }

    const targetUserId = this.auth.isClient() ? (this.auth.getCurrentUserId() ?? 0) : Number(this.userId);
    if (!targetUserId) {
      this.error = 'Veuillez saisir userId.';
      return;
    }

    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.vm.findByUser(targetUserId, this.readFilterValue(), this.page, this.size)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (page) => {
          this.userId = targetUserId;
          this.notifications = page.content ?? [];
          this.totalPages = page.totalPages ?? 0;
          this.totalElements = page.totalElements ?? 0;
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.error = this.readError(error, 'Impossible de charger les notifications.');
          this.cdr.markForCheck();
        }
      });
  }

  createNotification(): void {
    if (!this.canManageNotifications()) {
      this.error = 'Seuls les agents et administrateurs peuvent creer des notifications.';
      return;
    }

    const request: NotificationCreateRequest = {
      userId: Number(this.draft.userId),
      reclamationId: this.draft.reclamationId ? Number(this.draft.reclamationId) : null,
      type: this.draft.type,
      title: this.draft.title.trim(),
      message: this.draft.message.trim()
    };

    if (!request.userId || request.title.length === 0 || request.message.length < 3) {
      this.error = 'userId, titre et message sont obligatoires.';
      return;
    }

    this.actionLoading = true;
    this.error = null;
    this.success = null;
    this.cdr.markForCheck();

    this.vm.create(request)
      .pipe(finalize(() => {
        this.actionLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.success = 'Notification creee.';
          this.draft = {
            userId: request.userId,
            reclamationId: null,
            type: 'PUSH',
            title: '',
            message: ''
          };
          this.userId = request.userId;
          this.loadNotifications(true);
        },
        error: (error: unknown) => {
          this.error = this.readError(error, 'Impossible de creer la notification.');
          this.cdr.markForCheck();
        }
      });
  }

  markAsRead(notification: Notification): void {
    const id = notification.notificationId;
    if (!id) {
      return;
    }

    this.vm.markAsRead(id).subscribe({
      next: () => {
        this.success = 'Notification marquee comme lue.';
        this.loadNotifications();
      },
      error: (error: unknown) => {
        this.error = this.readError(error, 'Impossible de marquer la notification.');
        this.cdr.markForCheck();
      }
    });
  }

  deleteNotification(notification: Notification): void {
    const id = notification.notificationId;
    if (!id) {
      return;
    }

    this.vm.delete(id).subscribe({
      next: () => {
        this.success = 'Notification supprimee.';
        this.loadNotifications();
      },
      error: (error: unknown) => {
        this.error = this.readError(error, 'Impossible de supprimer la notification.');
        this.cdr.markForCheck();
      }
    });
  }

  changePage(delta: number): void {
    const nextPage = this.page + delta;
    if (nextPage < 0 || (this.totalPages > 0 && nextPage >= this.totalPages)) {
      return;
    }

    this.page = nextPage;
    this.loadNotifications();
  }

  formatDate(value?: string): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('fr-FR');
  }

  trackNotification(index: number, notification: Notification): number {
    return notification.notificationId ?? index;
  }

  typeClass(type: NotificationType): string {
    return `chip chip--${type.toLowerCase()}`;
  }

  canManageNotifications(): boolean {
    return this.auth.isSupportStaff();
  }

  private readFilterValue(): boolean | null {
    if (this.readFilter === 'READ') {
      return true;
    }

    if (this.readFilter === 'UNREAD') {
      return false;
    }

    return null;
  }

  private readError(error: unknown, fallback: string): string {
    const maybeError = error as { error?: { message?: string; details?: string; error?: string }; message?: string };
    return maybeError.error?.message ?? maybeError.error?.details ?? maybeError.error?.error ?? maybeError.message ?? fallback;
  }
}
