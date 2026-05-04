import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { UserApi } from '../data-access/user.api';
import { User, UserStatus } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserVm {
  private readonly api = inject(UserApi);

  findAll(): Observable<User[]> {
    return this.api.findAll();
  }

  findById(id: number): Observable<User> {
    return this.api.findById(id);
  }

  updateStatus(id: number, status: UserStatus): Observable<User> {
    return this.api.updateStatus(id, status);
  }
}
