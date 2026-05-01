import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { MessageApi, DirectMessage } from '../../data-access/message.api';
import { AdminApi } from '../../../admin/data-access/admin.api';
import { UserResponse, PageResponse } from '../../../admin/models/admin.model';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-page.component.html',
  styleUrl: './chat-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatPageComponent implements OnInit, OnDestroy {
  private readonly messageApi = inject(MessageApi);
  private readonly adminApi = inject(AdminApi);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly notify = inject(NotificationService);
  readonly auth = inject(AuthService);

  users: UserResponse[] = [];
  selectedUser: UserResponse | null = null;
  messages: DirectMessage[] = [];
  newMessage = '';
  loading = false;
  loadingMessages = false;
  unreadCount = 0;
  unreadBySender = new Map<number, number>();
  private pollTimer: number | null = null;

  ngOnInit(): void {
    this.loadUsers();
    this.pollUnread(false);
    this.pollTimer = window.setInterval(() => {
      this.pollUnread(true);
      if (this.selectedUser) {
        this.loadConversation(false);
      }
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.pollTimer) {
      window.clearInterval(this.pollTimer);
    }
  }

  loadUsers(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.adminApi.findUsers(undefined, undefined, undefined, undefined, undefined, 0, 100).subscribe({
      next: (data: PageResponse<UserResponse>) => {
        const myId = this.auth.getCurrentUserId();
        let filteredUsers = (data.content ?? []).filter(u => u.userId !== myId);

        // Role-based filtering
        if (this.auth.isAdmin()) {
          // Admins can message other admins and agents
          filteredUsers = filteredUsers.filter(u => u.role === 'ADMIN' || u.role === 'AGENT');
        } else if (this.auth.isAgent()) {
          // Agents can message admins and other agents
          filteredUsers = filteredUsers.filter(u => u.role === 'ADMIN' || u.role === 'AGENT');
        } else if (this.auth.isClient()) {
          // Clients can message agents (for support)
          filteredUsers = filteredUsers.filter(u => u.role === 'AGENT');
        }

        this.users = filteredUsers;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  selectUser(user: UserResponse): void {
    this.selectedUser = user;
    this.loadConversation();
    if (user.userId) {
      this.unreadBySender.delete(user.userId);
    }
    this.recalculateUnreadCount();
  }

  loadConversation(showLoading = true): void {
    if (!this.selectedUser?.userId) return;
    this.loadingMessages = showLoading;
    this.cdr.markForCheck();
    this.messageApi.getConversation(this.selectedUser.userId)
      .pipe(finalize(() => { this.loadingMessages = false; this.cdr.markForCheck(); }))
      .subscribe(msgs => {
        this.messages = msgs;
        if (this.selectedUser?.userId) {
          this.messageApi.markConversationRead(this.selectedUser.userId).subscribe();
        }
        this.cdr.markForCheck();
      });
  }

  sendMessage(): void {
    if (!this.selectedUser?.userId || !this.newMessage.trim()) return;
    const content = this.newMessage.trim();
    this.newMessage = '';
    this.messageApi.sendMessage(this.selectedUser.userId, content).subscribe(() => {
      this.loadConversation();
    });
  }

  isMe(msg: DirectMessage): boolean {
    return msg.senderId === this.auth.getCurrentUserId();
  }

  private pollUnread(showToast: boolean): void {
    const previousCount = this.unreadCount;
    this.messageApi.getUnreadMessages().subscribe({
      next: (messages) => {
        const grouped = new Map<number, number>();
        messages.forEach(message => {
          grouped.set(message.senderId, (grouped.get(message.senderId) || 0) + 1);
        });
        this.unreadBySender = grouped;
        this.recalculateUnreadCount();
        if (showToast && this.unreadCount > previousCount) {
          const latest = messages[0];
          this.notify.info('New message', latest?.content ? latest.content.slice(0, 80) : 'You received a new message');
        }
        this.cdr.markForCheck();
      }
    });
  }

  private recalculateUnreadCount(): void {
    this.unreadCount = Array.from(this.unreadBySender.values()).reduce((sum, count) => sum + count, 0);
  }
}
