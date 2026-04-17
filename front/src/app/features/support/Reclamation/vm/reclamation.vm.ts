import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReclamationApi } from '../data-access/reclamation.api';
import { Reclamation, ReclamationStatus } from '../models/reclamation.model';

@Injectable({ providedIn: 'root' })
export class ReclamationVm {
  private readonly api = inject(ReclamationApi);

  findAll(): Observable<Reclamation[]> {
    return this.api.findAll();
  }

  findById(id: number): Observable<Reclamation> {
    return this.api.findById(id);
  }

  updateStatus(id: number, status: ReclamationStatus): Observable<Reclamation> {
    return this.api.updateStatus(id, status);
  }
}
