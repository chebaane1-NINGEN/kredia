import { SpringPage } from '../../Reclamation/models/reclamation.model';

export type NotificationType = 'SMS' | 'EMAIL' | 'PUSH';

export interface Notification {
  notificationId?: number;
  userId: number;
  reclamationId?: number | null;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  sentAt?: string;
}

export interface NotificationCreateRequest {
  userId: number;
  reclamationId?: number | null;
  type: NotificationType;
  title: string;
  message: string;
}

export type NotificationPage = SpringPage<Notification>;
