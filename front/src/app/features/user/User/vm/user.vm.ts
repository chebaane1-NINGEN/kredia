import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { UserApi } from '../data-access/user.api';
import { User, UserStatus } from '../models/user.model';

import { AdminApi } from '../../../admin/data-access/admin.api';

@Injectable({ providedIn: 'root' })
export class UserVm {
  private readonly api = inject(UserApi);
  private readonly adminApi = inject(AdminApi);

  findAll(): Observable<User[]> {
    return this.api.findAll(undefined, undefined, undefined, 0, 50).pipe(
      map(response => response.users)
    );
  }

  findAgentClients(): Observable<User[]> {
    return this.adminApi.getAgentClients(0, 100).pipe(
      map(response => response.content as any)
    );
  }

  findById(id: number): Observable<User> {
    return this.api.findById(id);
  }

  updateStatus(id: number, status: UserStatus): Observable<User> {
    return this.api.updateStatus(id, status);
  }
}
