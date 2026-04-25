import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { MessageApi, DirectMessage } from '../../data-access/message.api';
import { AdminApi } from '../../../admin/data-access/admin.api';
import { UserResponse, PageResponse } from '../../../admin/models/admin.model';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-page.component.html',
  styleUrl: './chat-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatPageComponent implements OnInit {
  private readonly messageApi = inject(MessageApi);
  private readonly adminApi = inject(AdminApi);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly auth = inject(AuthService);

  users: UserResponse[] = [];
  selectedUser: UserResponse | null = null;
  messages: DirectMessage[] = [];
  newMessage = '';
  loading = false;
  loadingMessages = false;

  ngOnInit(): void {
    this.loadUsers();
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
  }

  loadConversation(): void {
    if (!this.selectedUser?.userId) return;
    this.loadingMessages = true;
    this.cdr.markForCheck();
    this.messageApi.getConversation(this.selectedUser.userId)
      .pipe(finalize(() => { this.loadingMessages = false; this.cdr.markForCheck(); }))
      .subscribe(msgs => {
        this.messages = msgs;
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
}
