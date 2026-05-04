import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, catchError, finalize, forkJoin, of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../../core/services/auth.service';
import { downloadBlob } from '../../../../../core/utils/download.util';
import {
  Reclamation,
  ReclamationAttachment,
  ReclamationCategory,
  ReclamationCreateRequest,
  ReclamationDashboard,
  ReclamationHistory,
  ReclamationMessage,
  ReclamationMessageCreateRequest,
  ReclamationMessageVisibility,
  ReclamationPriority,
  ReclamationRiskLevel,
  ReclamationStatus,
  ReclamationUpdateRequest,
  RiskScoreResponse
} from '../../models/reclamation.model';
import { ReclamationVm } from '../../vm/reclamation.vm';

type ReclamationFilterMode = 'ALL' | 'MINE' | 'USER' | 'STATUS';
type ClientWorkspaceTab = 'conversation' | 'documents' | 'edit' | 'history' | 'feedback';
type AdminWorkspaceTab = 'conversation' | 'documents' | 'history' | 'duplicates';

@Component({
  selector: 'app-reclamation-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reclamation-page.component.html',
  styleUrl: './reclamation-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReclamationPageComponent implements OnInit {
  private readonly vm = inject(ReclamationVm);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly statuses: ReclamationStatus[] = [
    'OPEN',
    'IN_PROGRESS',
    'WAITING_CUSTOMER',
    'ESCALATED',
    'REOPENED',
    'RESOLVED',
    'REJECTED'
  ];
  readonly categories: ReclamationCategory[] = ['PAYMENT', 'CREDIT', 'KYC', 'FRAUD', 'ACCOUNT', 'TECHNICAL_SUPPORT', 'OTHER'];
  readonly priorities: ReclamationPriority[] = ['LOW', 'MEDIUM', 'HIGH'];
  readonly visibilities: ReclamationMessageVisibility[] = ['CUSTOMER', 'INTERNAL'];
  readonly currentUserId = this.auth.getCurrentUserId() ?? 0;

  dashboard: ReclamationDashboard | null = null;
  reclamations: Reclamation[] = [];
  selected: Reclamation | null = null;
  history: ReclamationHistory[] = [];
  messages: ReclamationMessage[] = [];
  attachments: ReclamationAttachment[] = [];
  duplicates: Reclamation[] = [];
  risk: RiskScoreResponse | null = null;

  loadingDashboard = false;
  loadingList = false;
  loadingDetails = false;
  actionLoading = false;
  exportingPdf = false;
  error: string | null = null;
  success: string | null = null;

  page = 0;
  size = 10;
  totalPages = 0;
  totalElements = 0;
  filterMode: ReclamationFilterMode = 'ALL';
  statusFilter: ReclamationStatus = 'OPEN';
  userFilterId = this.currentUserId;
  includeInternal = !this.auth.isClient();
  selectedFile: File | null = null;
  clientWorkspaceTab: ClientWorkspaceTab = 'conversation';
  adminWorkspaceTab: AdminWorkspaceTab = 'conversation';

  createDraft: ReclamationCreateRequest = {
    userId: this.currentUserId,
    subject: '',
    description: '',
    priority: 'MEDIUM',
    category: 'OTHER'
  };

  editDraft: ReclamationUpdateRequest = {
    subject: '',
    description: '',
    priority: 'MEDIUM',
    category: 'OTHER'
  };

  statusDraft = {
    actorUserId: this.currentUserId,
    newStatus: 'IN_PROGRESS' as ReclamationStatus,
    note: ''
  };

  assignDraft = {
    actorUserId: this.currentUserId,
    agentUserId: 0,
    note: ''
  };

  messageDraft: ReclamationMessageCreateRequest = {
    authorUserId: this.currentUserId,
    visibility: 'CUSTOMER',
    message: ''
  };

  feedbackDraft = {
    actorUserId: this.currentUserId,
    customerSatisfactionScore: 5,
    customerFeedback: ''
  };

  private pendingFocusReclamationId: number | null = null;
  private resolvingFocusedReclamation = false;
  private autoRefreshId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const focusedId = Number(params.get('focus'));
        this.pendingFocusReclamationId = Number.isFinite(focusedId) && focusedId > 0
          ? focusedId
          : null;

        if (this.pendingFocusReclamationId) {
          this.focusRequestedReclamation();
        }
      });

    if (this.auth.isClient()) {
      this.size = 20;
      this.filterMode = 'MINE';
      this.createDraft.userId = this.currentUserId;
    }

    if (this.canViewDashboard()) {
      this.loadDashboard();
    }
    this.loadReclamations(true);
    this.startClientAutoRefresh();
  }

  loadDashboard(): void {
    if (!this.canViewDashboard()) {
      this.dashboard = null;
      this.loadingDashboard = false;
      this.cdr.markForCheck();
      return;
    }

    this.loadingDashboard = true;
    this.cdr.markForCheck();

    this.vm.dashboard()
      .pipe(finalize(() => {
        this.loadingDashboard = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (dashboard) => {
          this.dashboard = dashboard;
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.error = this.readError(error, 'Impossible de charger le tableau de bord.');
          this.cdr.markForCheck();
        }
      });
  }

  loadReclamations(resetPage = false, silent = false): void {
    if (resetPage) {
      this.page = 0;
    }

    if (!silent) {
      this.loadingList = true;
    }
    this.error = null;
    this.cdr.markForCheck();

    const request$ = this.filterMode === 'MINE'
      ? this.vm.findByUser(this.currentUserId, this.page, this.size)
      : this.filterMode === 'USER'
        ? this.vm.findByUser(Number(this.userFilterId), this.page, this.size)
        : this.filterMode === 'STATUS'
          ? this.vm.findByStatus(this.statusFilter, this.page, this.size)
          : this.vm.findAll(this.page, this.size);

    request$
      .pipe(finalize(() => {
        if (!silent) {
          this.loadingList = false;
        }
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (page) => {
          this.reclamations = page.content ?? [];
          this.totalPages = page.totalPages ?? 0;
          this.totalElements = page.totalElements ?? 0;

          const selectedId = this.selected?.reclamationId;
          const stillSelected = selectedId
            ? this.reclamations.find((item) => item.reclamationId === selectedId) ?? null
            : null;

          if (stillSelected) {
            this.selected = stillSelected;
            this.patchDetailForms(stillSelected);
          } else if (!this.selected && this.reclamations.length > 0) {
            this.selectReclamation(this.reclamations[0]);
          } else if (this.reclamations.length === 0) {
            this.clearSelection();
          }

          this.focusRequestedReclamation();
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          if (!silent) {
            this.error = this.readError(error, 'Impossible de charger les reclamations.');
          }
          this.cdr.markForCheck();
        }
      });
  }

  selectReclamation(reclamation: Reclamation): void {
    this.selected = reclamation;
    this.risk = null;
    this.clientWorkspaceTab = 'conversation';
    this.adminWorkspaceTab = 'conversation';
    this.patchDetailForms(reclamation);
    this.loadSelectedDetails();
  }

  createReclamation(): void {
    const request: ReclamationCreateRequest = {
      userId: Number(this.createDraft.userId),
      subject: this.createDraft.subject.trim(),
      description: this.createDraft.description.trim(),
      ...(this.auth.isSupportStaff()
        ? {
            priority: this.createDraft.priority,
            category: this.createDraft.category
          }
        : {})
    };

    if (!request.userId || request.subject.length === 0 || request.description.length < 10) {
      this.error = 'Veuillez saisir un utilisateur, un sujet et une description de 10 caracteres minimum.';
      return;
    }

    this.runAction(
      this.vm.create(request),
      'Reclamation creee.',
      (created) => {
        this.createDraft = {
          userId: this.auth.isClient() ? this.currentUserId : request.userId,
          subject: '',
          description: '',
          priority: 'LOW',
          category: 'OTHER'
        };
        this.selectReclamation(created);
        this.loadDashboard();
        this.loadReclamations(true);
      }
    );
  }

  updateSelectedContent(): void {
    const selectedId = this.selected?.reclamationId;
    if (!selectedId) {
      return;
    }

    const request: ReclamationUpdateRequest = {
      subject: this.editDraft.subject.trim(),
      description: this.editDraft.description.trim(),
      priority: this.auth.isClient() ? (this.selected?.priority ?? this.editDraft.priority) : this.editDraft.priority,
      category: this.auth.isClient() ? (this.selected?.category ?? this.editDraft.category) : this.editDraft.category
    };

    if (request.subject.length === 0 || request.description.length < 10) {
      this.error = 'Le sujet est obligatoire et la description doit contenir au moins 10 caracteres.';
      return;
    }

    this.runAction(
      this.vm.update(selectedId, request),
      'Reclamation mise a jour.',
      (updated) => this.afterReclamationMutation(updated)
    );
  }

  updateSelectedStatus(): void {
    const selectedId = this.selected?.reclamationId;
    if (!selectedId || !this.canUpdateStatus(this.selected)) {
      return;
    }

    this.runAction(
      this.vm.updateStatus(selectedId, {
        actorUserId: Number(this.statusDraft.actorUserId),
        newStatus: this.statusDraft.newStatus,
        note: this.statusDraft.note.trim() || undefined
      }),
      'Statut mis a jour.',
      (updated) => this.afterReclamationMutation(updated)
    );
  }

  assignSelected(): void {
    const selectedId = this.selected?.reclamationId;
    if (!selectedId || !this.canAssignSelected()) {
      return;
    }

    if (!Number(this.assignDraft.actorUserId) || !Number(this.assignDraft.agentUserId)) {
      this.error = 'Veuillez saisir actorUserId et agentUserId.';
      return;
    }

    this.runAction(
      this.vm.assign(selectedId, {
        actorUserId: Number(this.assignDraft.actorUserId),
        agentUserId: Number(this.assignDraft.agentUserId),
        note: this.assignDraft.note.trim() || undefined
      }),
      'Reclamation assignee.',
      (updated) => this.afterReclamationMutation(updated)
    );
  }

  sendMessage(): void {
    const selectedId = this.selected?.reclamationId;
    if (!selectedId) {
      return;
    }

    const message = this.messageDraft.message.trim();
    if (message.length < 2) {
      this.error = 'Le message doit contenir au moins 2 caracteres.';
      return;
    }

    this.runAction(
      this.vm.addMessage(selectedId, {
        authorUserId: this.auth.isClient() ? this.currentUserId : Number(this.messageDraft.authorUserId),
        visibility: this.auth.isClient() ? 'CUSTOMER' : this.messageDraft.visibility,
        message
      }),
      'Message ajoute.',
      () => {
        this.messageDraft.message = '';
        this.refreshSelected();
      }
    );
  }

  uploadAttachment(): void {
    const selectedId = this.selected?.reclamationId;
    if (!selectedId || !this.selectedFile) {
      this.error = 'Veuillez choisir une reclamation et un fichier.';
      return;
    }

    const uploadedByUserId = Number(this.messageDraft.authorUserId || this.currentUserId);
    if (!uploadedByUserId) {
      this.error = 'uploadedByUserId est obligatoire.';
      return;
    }

    this.runAction(
      this.vm.addAttachment(selectedId, uploadedByUserId, this.selectedFile),
      'Piece jointe ajoutee.',
      () => {
        this.selectedFile = null;
        this.refreshSelected();
      }
    );
  }

  submitFeedback(): void {
    const selectedId = this.selected?.reclamationId;
    if (!selectedId || !this.canSubmitFeedback(this.selected)) {
      return;
    }

    this.runAction(
      this.vm.submitFeedback(selectedId, {
        actorUserId: this.auth.isClient() ? this.currentUserId : Number(this.feedbackDraft.actorUserId),
        customerSatisfactionScore: Number(this.feedbackDraft.customerSatisfactionScore),
        customerFeedback: this.feedbackDraft.customerFeedback.trim() || undefined
      }),
      'Feedback enregistre.',
      (updated) => this.afterReclamationMutation(updated)
    );
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.item(0) ?? null;
  }

  toggleInternalMessages(): void {
    this.loadSelectedDetails();
  }

  changePage(delta: number): void {
    const nextPage = this.page + delta;
    if (nextPage < 0 || (this.totalPages > 0 && nextPage >= this.totalPages)) {
      return;
    }

    this.page = nextPage;
    this.loadReclamations();
  }

  downloadSelectedPdf(): void {
    const selectedId = this.selected?.reclamationId;
    if (!selectedId) {
      return;
    }

    this.exportingPdf = true;
    this.error = null;
    this.cdr.markForCheck();

    this.vm.exportPdf(selectedId, this.canUseInternalMessages())
      .pipe(finalize(() => {
        this.exportingPdf = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (blob) => {
          downloadBlob(blob, `reclamation_${selectedId}.pdf`);
          this.success = 'Export PDF genere.';
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.error = this.readError(error, 'Impossible de generer le PDF de la reclamation.');
          this.cdr.markForCheck();
        }
      });
  }

  resetFilters(): void {
    this.filterMode = this.auth.isClient() ? 'MINE' : 'ALL';
    this.statusFilter = 'OPEN';
    this.userFilterId = this.currentUserId;
    this.loadReclamations(true);
  }

  getAllowedStatuses(status: ReclamationStatus): ReclamationStatus[] {
    if (this.auth.isClient()) {
      return this.isClosed(status) ? ['REOPENED'] : [];
    }

    switch (status) {
      case 'OPEN':
        return ['IN_PROGRESS', 'WAITING_CUSTOMER', 'ESCALATED', 'REJECTED'];
      case 'IN_PROGRESS':
        return ['WAITING_CUSTOMER', 'ESCALATED', 'RESOLVED', 'REJECTED'];
      case 'WAITING_CUSTOMER':
        return ['IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'REJECTED'];
      case 'ESCALATED':
        return ['IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'REJECTED'];
      case 'REOPENED':
        return ['IN_PROGRESS', 'WAITING_CUSTOMER', 'ESCALATED', 'REJECTED'];
      case 'RESOLVED':
      case 'REJECTED':
        return ['REOPENED'];
    }
  }

  isClosed(status: ReclamationStatus): boolean {
    return status === 'RESOLVED' || status === 'REJECTED';
  }

  canUseInternalMessages(): boolean {
    return this.auth.isSupportStaff();
  }

  canViewDashboard(): boolean {
    return this.auth.isSupportStaff();
  }

  canViewRiskInsights(): boolean {
    return this.auth.isSupportStaff();
  }

  canAssignSelected(): boolean {
    return this.auth.isSupportStaff();
  }

  canUpdateStatus(reclamation: Reclamation | null): boolean {
    return !!reclamation && this.getAllowedStatuses(reclamation.status).length > 0;
  }

  canSubmitFeedback(reclamation: Reclamation | null): boolean {
    return !!reclamation && this.auth.isClient() && this.isClosed(reclamation.status);
  }

  canClientReopen(reclamation: Reclamation | null): boolean {
    return !!reclamation && this.auth.isClient() && this.canUpdateStatus(reclamation);
  }

  setClientWorkspaceTab(tab: ClientWorkspaceTab): void {
    this.clientWorkspaceTab = tab;
  }

  setAdminWorkspaceTab(tab: AdminWorkspaceTab): void {
    this.adminWorkspaceTab = tab;
  }

  reopenSelected(): void {
    if (!this.selected || !this.canClientReopen(this.selected)) {
      return;
    }

    this.statusDraft = {
      actorUserId: this.currentUserId,
      newStatus: 'REOPENED',
      note: 'Customer requested a follow-up.'
    };
    this.updateSelectedStatus();
  }

  statusClass(status: ReclamationStatus): string {
    return `chip status status--${status.toLowerCase().replace('_', '-')}`;
  }

  priorityClass(priority: ReclamationPriority): string {
    return `chip priority priority--${priority.toLowerCase()}`;
  }

  riskClass(riskLevel: ReclamationRiskLevel): string {
    return `chip risk risk--${riskLevel.toLowerCase()}`;
  }

  trackReclamation(_index: number, item: Reclamation): number {
    return item.reclamationId ?? 0;
  }

  trackMessage(_index: number, item: ReclamationMessage): number {
    return item.messageId ?? _index;
  }

  trackHistory(_index: number, item: ReclamationHistory): number {
    return item.historyId ?? _index;
  }

  trackAttachment(_index: number, item: ReclamationAttachment): number {
    return item.attachmentId ?? _index;
  }

  formatDate(value?: string | null): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatBytes(value?: number | null): string {
    if (!value) {
      return '-';
    }

    if (value < 1024) {
      return `${value} B`;
    }

    if (value < 1024 * 1024) {
      return `${(value / 1024).toFixed(1)} KB`;
    }

    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  formatScore(value?: number | null): string {
    if (value === null || value === undefined) {
      return '-';
    }

    return `${Math.round(value)} / 100`;
  }

  previewText(value: string, maxLength = 120): string {
    const normalized = value.replace(/\s+/g, ' ').trim();
    if (normalized.length <= maxLength) {
      return normalized;
    }

    return `${normalized.slice(0, maxLength).trim()}...`;
  }

  categoryLabel(category: ReclamationCategory): string {
    switch (category) {
      case 'PAYMENT':
        return 'Paiement';
      case 'CREDIT':
        return 'Credit';
      case 'KYC':
        return 'Verification KYC';
      case 'FRAUD':
        return 'Fraude';
      case 'ACCOUNT':
        return 'Compte';
      case 'TECHNICAL_SUPPORT':
        return 'Support technique';
      default:
        return 'Autre demande';
    }
  }

  priorityLabel(priority: ReclamationPriority): string {
    switch (priority) {
      case 'HIGH':
        return 'Elevee';
      case 'MEDIUM':
        return 'Moyenne';
      default:
        return 'Normale';
    }
  }

  statusLabel(status: ReclamationStatus): string {
    switch (status) {
      case 'OPEN':
        return 'Recue';
      case 'IN_PROGRESS':
        return 'En traitement';
      case 'WAITING_CUSTOMER':
        return 'En attente de votre retour';
      case 'ESCALATED':
        return 'Traitee en priorite';
      case 'REOPENED':
        return 'Rouverte';
      case 'RESOLVED':
        return 'Resolue';
      case 'REJECTED':
        return 'Cloturee';
    }
  }

  clientStatusHeadline(ticket: Reclamation): string {
    switch (ticket.status) {
      case 'OPEN':
        return 'Votre demande vient d etre recue et va etre examinee par notre equipe.';
      case 'IN_PROGRESS':
        return 'Notre equipe travaille actuellement sur votre demande.';
      case 'WAITING_CUSTOMER':
        return 'Nous attendons un complement d information de votre part pour avancer.';
      case 'ESCALATED':
        return 'Votre demande a ete priorisee pour un traitement plus rapide.';
      case 'REOPENED':
        return 'Votre demande a ete rouverte et repart dans le circuit support.';
      case 'RESOLVED':
        return 'La demande a ete resolue. Vous pouvez laisser votre avis ci-dessous.';
      case 'REJECTED':
        return 'La demande a ete cloturee. Si besoin, vous pouvez la rouvrir.';
    }
  }

  messageAuthorLabel(message: ReclamationMessage, ticket: Reclamation): string {
    if (message.authorUserId === this.currentUserId || message.authorUserId === ticket.userId) {
      return 'Vous';
    }

    return 'Equipe support';
  }

  attachmentAuthorLabel(attachment: ReclamationAttachment, ticket: Reclamation): string {
    if (!attachment.uploadedByUserId) {
      return 'Ajoute par le systeme';
    }

    return attachment.uploadedByUserId === this.currentUserId || attachment.uploadedByUserId === ticket.userId
      ? 'Ajoute par vous'
      : 'Ajoute par le support';
  }

  historyActorLabel(history: ReclamationHistory, ticket: Reclamation): string {
    if (!history.actorUserId) {
      return 'Systeme';
    }

    return history.actorUserId === this.currentUserId || history.actorUserId === ticket.userId
      ? 'Vous'
      : 'Equipe support';
  }

  private loadSelectedDetails(silent = false): void {
    const selectedId = this.selected?.reclamationId;
    if (!selectedId) {
      return;
    }

    if (!silent) {
      this.loadingDetails = true;
    }
    this.cdr.markForCheck();

    forkJoin({
      history: this.vm.getHistory(selectedId).pipe(catchError(() => of([] as ReclamationHistory[]))),
      messages: this.vm.getMessages(selectedId, this.includeInternal).pipe(catchError(() => of([] as ReclamationMessage[]))),
      attachments: this.vm.getAttachments(selectedId).pipe(catchError(() => of([] as ReclamationAttachment[]))),
      duplicates: this.canViewRiskInsights()
        ? this.vm.getDuplicateCandidates(selectedId).pipe(catchError(() => of([] as Reclamation[])))
        : of([] as Reclamation[]),
      risk: this.canViewRiskInsights()
        ? this.vm.getRisk(selectedId).pipe(catchError(() => of(null as RiskScoreResponse | null)))
        : of(null as RiskScoreResponse | null)
    })
      .pipe(finalize(() => {
        if (!silent) {
          this.loadingDetails = false;
        }
        this.cdr.markForCheck();
      }))
      .subscribe((data) => {
        this.history = data.history;
        this.messages = data.messages;
        this.attachments = data.attachments;
        this.duplicates = data.duplicates;
        this.risk = data.risk;
        if (this.selected && data.risk && this.selected.reclamationId === data.risk.reclamationId) {
          const nextSelected: Reclamation = {
            ...this.selected,
            riskScore: data.risk.riskScore,
            riskLevel: data.risk.riskLevel ?? this.selected.riskLevel,
            modelInput: data.risk.features ?? this.selected.modelInput ?? null
          };
          this.selected = nextSelected;
          this.reclamations = this.reclamations.map((item) =>
            item.reclamationId === nextSelected.reclamationId
              ? {
                  ...item,
                  riskScore: nextSelected.riskScore,
                  riskLevel: nextSelected.riskLevel
                }
              : item
          );
        }
        this.cdr.markForCheck();
      });
  }

  private patchDetailForms(reclamation: Reclamation): void {
    const actorId = this.currentUserId || reclamation.userId;

    this.editDraft = {
      subject: reclamation.subject,
      description: reclamation.description,
      priority: reclamation.priority,
      category: reclamation.category
    };
    this.statusDraft = {
      actorUserId: actorId,
      newStatus: this.getAllowedStatuses(reclamation.status)[0] ?? reclamation.status,
      note: ''
    };
    this.assignDraft = {
      actorUserId: actorId,
      agentUserId: reclamation.assignedTo ?? actorId,
      note: ''
    };
    this.messageDraft = {
      authorUserId: actorId,
      visibility: 'CUSTOMER',
      message: ''
    };
    this.feedbackDraft = {
      actorUserId: reclamation.userId,
      customerSatisfactionScore: reclamation.customerSatisfactionScore ?? 5,
      customerFeedback: reclamation.customerFeedback ?? ''
    };
  }

  private afterReclamationMutation(updated: Reclamation): void {
    this.selected = updated;
    this.patchDetailForms(updated);
    this.loadSelectedDetails();
    if (this.canViewDashboard()) {
      this.loadDashboard();
    }
    this.loadReclamations();
  }

  private refreshSelected(): void {
    const selectedId = this.selected?.reclamationId;
    if (!selectedId) {
      return;
    }

    this.vm.findById(selectedId).subscribe({
      next: (updated) => this.afterReclamationMutation(updated),
      error: (error: unknown) => {
        this.error = this.readError(error, 'Impossible de rafraichir la reclamation.');
        this.cdr.markForCheck();
      }
    });
  }

  private clearSelection(): void {
    this.selected = null;
    this.history = [];
    this.messages = [];
    this.attachments = [];
    this.duplicates = [];
    this.risk = null;
  }

  private runAction<T>(
    action$: Observable<T>,
    successMessage: string,
    onSuccess: (value: T) => void
  ): void {
    this.actionLoading = true;
    this.error = null;
    this.success = null;
    this.cdr.markForCheck();

    action$
      .pipe(finalize(() => {
        this.actionLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (value: T) => {
          this.success = successMessage;
          onSuccess(value);
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.error = this.readError(error, 'Operation impossible.');
          this.cdr.markForCheck();
        }
      });
  }

  private focusRequestedReclamation(): void {
    const focusedId = this.pendingFocusReclamationId;
    if (!focusedId || this.resolvingFocusedReclamation) {
      return;
    }

    const listedReclamation = this.reclamations.find((item) => item.reclamationId === focusedId);
    if (listedReclamation) {
      this.pendingFocusReclamationId = null;
      this.selectReclamation(listedReclamation);
      this.clearFocusQueryParam();
      return;
    }

    this.resolvingFocusedReclamation = true;
    this.vm.findById(focusedId)
      .pipe(finalize(() => {
        this.resolvingFocusedReclamation = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (reclamation) => {
          this.pendingFocusReclamationId = null;
          this.selected = reclamation;
          this.patchDetailForms(reclamation);
          this.loadSelectedDetails();
          this.clearFocusQueryParam();
          this.cdr.markForCheck();
        },
        error: () => {
          this.pendingFocusReclamationId = null;
          this.clearFocusQueryParam();
          this.cdr.markForCheck();
        }
      });
  }

  private clearFocusQueryParam(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { focus: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  private startClientAutoRefresh(): void {
    if (!this.auth.isClient() || this.autoRefreshId) {
      return;
    }

    this.autoRefreshId = setInterval(() => {
      this.loadReclamations(false, true);
      if (this.selected) {
        this.loadSelectedDetails(true);
      }
    }, 15000);

    this.destroyRef.onDestroy(() => {
      if (this.autoRefreshId) {
        clearInterval(this.autoRefreshId);
        this.autoRefreshId = null;
      }
    });
  }

  private readError(error: unknown, fallback: string): string {
    const maybeError = error as {
      error?: { message?: string; error?: string; details?: string };
      message?: string;
    };

    return maybeError.error?.message
      ?? maybeError.error?.details
      ?? maybeError.error?.error
      ?? maybeError.message
      ?? fallback;
  }
}
