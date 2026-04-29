import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { NotificationService, Notification } from '../../services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
  animations: [
    trigger('slideInOut', [
      state('in', style({ transform: 'translateX(0)', opacity: 1 })),
      transition('void => *', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-in')
      ]),
      transition('* => void', [
        animate('300ms ease-out', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class NotificationComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private subscription!: Subscription;

  notifications: Notification[] = [];

  ngOnInit(): void {
    this.subscription = this.notificationService.notifications.subscribe(
      notifications => this.notifications = notifications
    );
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  remove(id: string): void {
    this.notificationService.remove(id);
  }
}