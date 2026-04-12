import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  standalone: true,
  templateUrl: './notification-page.component.html',
  styleUrl: './notification-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationPageComponent {}
