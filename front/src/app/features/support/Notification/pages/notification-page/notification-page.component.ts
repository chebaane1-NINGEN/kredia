import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { NotificationVm } from '../../vm/notification.vm';
import { Notification } from '../../models/notification.model';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-page.component.html',
  styleUrl: './notification-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationPageComponent implements OnInit {
  private readonly vm  = inject(NotificationVm);
  private readonly cdr = inject(ChangeDetectorRef);

  notifications: Notification[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading = true;
    this.error   = null;
    this.cdr.markForCheck();

    this.vm.findAll()
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next:  (data) => { this.notifications = data ?? []; this.cdr.markForCheck(); },
        error: ()     => { this.error = 'Unable to load notifications.'; this.cdr.markForCheck(); }
      });
  }

  markAsRead(id: number): void {
    this.vm.markAsRead(id).subscribe({
      next: (updated) => {
        this.notifications = this.notifications.map(n => n.notificationId === id ? updated : n);
        this.cdr.markForCheck();
      },
      error: () => { this.error = `Failed to mark notification #${id} as read.`; this.cdr.markForCheck(); }
    });
  }

  getTypeClass(type: string): string {
    return `type--${type.toLowerCase()}`;
  }
}
