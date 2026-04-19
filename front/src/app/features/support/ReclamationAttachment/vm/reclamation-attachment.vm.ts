import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReclamationAttachmentApi } from '../data-access/reclamation-attachment.api';
import { ReclamationAttachment } from '../models/reclamation-attachment.model';

@Injectable({ providedIn: 'root' })
export class ReclamationAttachmentVm {
  private readonly api = inject(ReclamationAttachmentApi);

  findAll(): Observable<ReclamationAttachment[]> {
    return this.api.findAll();
  }

  findByReclamation(reclamationId: number): Observable<ReclamationAttachment[]> {
    return this.api.findByReclamation(reclamationId);
  }

  delete(id: number): Observable<void> {
    return this.api.delete(id);
  }
}
