import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReclamationMessageApi } from '../data-access/reclamation-message.api';
import { ReclamationMessage, ReclamationMessageCreateRequest } from '../models/reclamation-message.model';

@Injectable({ providedIn: 'root' })
export class ReclamationMessageVm {
  private readonly api = inject(ReclamationMessageApi);

  findByReclamation(reclamationId: number, includeInternal = false): Observable<ReclamationMessage[]> {
    return this.api.findByReclamation(reclamationId, includeInternal);
  }

  send(reclamationId: number, request: ReclamationMessageCreateRequest): Observable<ReclamationMessage> {
    return this.api.send(reclamationId, request);
  }
}
