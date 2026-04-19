import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReclamationMessageApi } from '../data-access/reclamation-message.api';
import { ReclamationMessage } from '../models/reclamation-message.model';

@Injectable({ providedIn: 'root' })
export class ReclamationMessageVm {
  private readonly api = inject(ReclamationMessageApi);

  findAll(): Observable<ReclamationMessage[]> {
    return this.api.findAll();
  }

  findByReclamation(reclamationId: number): Observable<ReclamationMessage[]> {
    return this.api.findByReclamation(reclamationId);
  }

  send(message: ReclamationMessage): Observable<ReclamationMessage> {
    return this.api.send(message);
  }
}
