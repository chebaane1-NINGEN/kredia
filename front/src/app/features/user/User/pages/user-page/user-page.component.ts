import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { UserVm } from '../../vm/user.vm';
import { User } from '../../models/user.model';

import { AuthService } from '../../../../../core/services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-page.component.html',
  styleUrl: './user-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserPageComponent implements OnInit {
  private readonly vm  = inject(UserVm);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly auth = inject(AuthService);

  users: User[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error   = null;
    this.cdr.markForCheck();

    const request = this.auth.isAgent() ? this.vm.findAgentClients() : this.vm.findAll();

    request.pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next:  (data: User[]) => { this.users = data ?? []; this.cdr.markForCheck(); },
        error: ()     => { this.error = 'Unable to load users.'; this.cdr.markForCheck(); }
      });
  }

  getStatusClass(status: string): string {
    return `status--${status.toLowerCase()}`;
  }

  getRoleClass(role: string): string {
    return `role--${role.toLowerCase()}`;
  }
}
