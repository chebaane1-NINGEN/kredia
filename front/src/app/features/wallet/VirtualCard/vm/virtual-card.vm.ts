import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { VirtualCardApi } from '../data-access/virtual-card.api';
import { VirtualCard } from '../models/virtual-card.model';

@Injectable({ providedIn: 'root' })
export class VirtualCardVm {
  private readonly api = inject(VirtualCardApi);

  findAll(): Observable<VirtualCard[]> {
    return this.api.findAll();
  }

  findByUser(userId: number): Observable<VirtualCard[]> {
    return this.api.findByUser(userId);
  }

  block(id: number): Observable<VirtualCard> {
    return this.api.block(id);
  }

  unblock(id: number): Observable<VirtualCard> {
    return this.api.unblock(id);
  }
}
