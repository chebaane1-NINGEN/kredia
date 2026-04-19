import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { KycDocumentApi } from '../data-access/kyc-document.api';
import { KycDocument } from '../models/kyc-document.model';

@Injectable({ providedIn: 'root' })
export class KycDocumentVm {
  private readonly api = inject(KycDocumentApi);

  findAll(): Observable<KycDocument[]> {
    return this.api.findAll();
  }

  findByUser(userId: number): Observable<KycDocument[]> {
    return this.api.findByUser(userId);
  }

  approve(id: number): Observable<KycDocument> {
    return this.api.approve(id);
  }

  reject(id: number): Observable<KycDocument> {
    return this.api.reject(id);
  }
}
