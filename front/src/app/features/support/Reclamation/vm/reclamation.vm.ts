import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReclamationApi } from '../data-access/reclamation.api';
import {
  Reclamation,
  ReclamationAssignRequest,
  ReclamationAttachment,
  ReclamationCreateRequest,
  ReclamationDashboard,
  ReclamationFeedbackRequest,
  ReclamationHistory,
  ReclamationMessage,
  ReclamationMessageCreateRequest,
  ReclamationStatus,
  ReclamationStatusUpdateRequest,
  ReclamationUpdateRequest,
  RiskScoreResponse,
  SpringPage
} from '../models/reclamation.model';

@Injectable({ providedIn: 'root' })
export class ReclamationVm {
  private readonly api = inject(ReclamationApi);

  create(request: ReclamationCreateRequest): Observable<Reclamation> {
    return this.api.create(request);
  }

  update(id: number, request: ReclamationUpdateRequest): Observable<Reclamation> {
    return this.api.update(id, request);
  }

  updateStatus(id: number, request: ReclamationStatusUpdateRequest): Observable<Reclamation> {
    return this.api.updateStatus(id, request);
  }

  assign(id: number, request: ReclamationAssignRequest): Observable<Reclamation> {
    return this.api.assign(id, request);
  }

  dashboard(): Observable<ReclamationDashboard> {
    return this.api.dashboard();
  }

  findAll(page = 0, size = 10): Observable<SpringPage<Reclamation>> {
    return this.api.findAll(page, size);
  }

  findById(id: number): Observable<Reclamation> {
    return this.api.findById(id);
  }

  findByUser(userId: number, page = 0, size = 10): Observable<SpringPage<Reclamation>> {
    return this.api.findByUser(userId, page, size);
  }

  findByStatus(status: ReclamationStatus, page = 0, size = 10): Observable<SpringPage<Reclamation>> {
    return this.api.findByStatus(status, page, size);
  }

  getRisk(id: number): Observable<RiskScoreResponse> {
    return this.api.getRisk(id);
  }

  getHistory(id: number): Observable<ReclamationHistory[]> {
    return this.api.getHistory(id);
  }

  addMessage(id: number, request: ReclamationMessageCreateRequest): Observable<ReclamationMessage> {
    return this.api.addMessage(id, request);
  }

  getMessages(id: number, includeInternal = false): Observable<ReclamationMessage[]> {
    return this.api.getMessages(id, includeInternal);
  }

  addAttachment(id: number, uploadedByUserId: number, file: File): Observable<ReclamationAttachment> {
    return this.api.addAttachment(id, uploadedByUserId, file);
  }

  getAttachments(id: number): Observable<ReclamationAttachment[]> {
    return this.api.getAttachments(id);
  }

  submitFeedback(id: number, request: ReclamationFeedbackRequest): Observable<Reclamation> {
    return this.api.submitFeedback(id, request);
  }

  getDuplicateCandidates(id: number): Observable<Reclamation[]> {
    return this.api.getDuplicateCandidates(id);
  }

  exportPdf(id: number, includeInternal = false): Observable<Blob> {
    return this.api.exportPdf(id, includeInternal);
  }
}
