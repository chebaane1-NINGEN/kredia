import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AgentApi } from '../../data-access/agent.api';
import { AgentClient } from '../../models/agent.model';
import { PageResponse } from '../../../admin/models/admin.model';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-agent-clients-page',
  templateUrl: './agent-clients-page.component.html',
  styleUrls: ['./agent-clients-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AgentClientsPageComponent implements OnInit {
  private readonly api = inject(AgentApi);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly notify = inject(NotificationService);

  clients: AgentClient[] = [];
  loading = false;
  error: string | null = null;
  actionLoadingId: number | null = null;

  filterSearch = '';
  filterStatuses: string[] = [];
  filterPriorities: string[] = [];
  filterCreatedFrom = '';
  filterCreatedTo = '';
  filterRiskMin: number | null = null;
  filterRiskMax: number | null = null;
  sortBy = 'priorityScore';
  sortDirection: 'asc' | 'desc' = 'desc';

  currentPage = 0;
  pageSize = 50;
  pageSizeOptions = [25, 50, 100, 200];
  totalElements = 0;
  totalPages = 1;

  filterModalOpen = false;
  confirmModalOpen = false;
  confirmActionType: 'approve' | 'suspend' | 'reject' | null = null;
  confirmReason = '';
  selectedActionClient: AgentClient | null = null;
  showViewClientModal = false;
  selectedClient: AgentClient | null = null;

  // Add Client modal state
  showAddClientModal = false;
  newClientForm = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    status: 'ACTIVE',
    dateOfBirth: '',
    address: '',
    gender: ''
  };
  addClientLoading = false;
  addClientError: string | null = null;
  addClientSuccess = false;

  availableStatuses = ['PENDING_VERIFICATION', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLOCKED'];
  availablePriorities = ['HIGH', 'MEDIUM', 'LOW'];

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    const searchParam = this.filterSearch.trim() || undefined;
    const statusesParam = this.filterStatuses.length > 0 ? this.filterStatuses.join(',') : undefined;
    const prioritiesParam = this.filterPriorities.length > 0 ? this.filterPriorities.join(',') : undefined;
    const startDate = this.filterCreatedFrom || undefined;
    const endDate = this.filterCreatedTo || undefined;

    this.api.getClients(
      searchParam,
      statusesParam,
      this.currentPage,
      this.pageSize,
      this.sortBy,
      this.sortDirection,
      startDate,
      endDate,
      prioritiesParam
    )
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (response: PageResponse<AgentClient>) => {
          this.clients = response.content || [];
          this.totalElements = response.totalElements || 0;
          this.totalPages = response.totalPages || 1;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Agent clients load error', err);
          this.error = this.getErrorMessage(err);
          this.cdr.markForCheck();
        }
      });
  }

  private getErrorMessage(err: any): string {
    if (err?.error?.message) {
      return err.error.message;
    }
    if (err?.status === 403) {
      return 'Access denied. You do not have permission to view these clients.';
    }
    if (err?.status === 404) {
      return 'Agent clients endpoint was not found.';
    }
    return 'Unable to load clients right now. Try again in a moment.';
  }

  refreshClients(): void {
    this.currentPage = 0;
    this.loadClients();
  }

  onSearchInput(value: string): void {
    this.filterSearch = value;
    this.currentPage = 0;
    this.loadClients();
  }

  clearSearch(): void {
    this.filterSearch = '';
    this.currentPage = 0;
    this.loadClients();
  }

  openFilterModal(): void {
    this.filterModalOpen = true;
    this.cdr.markForCheck();
  }

  closeFilterModal(): void {
    this.filterModalOpen = false;
    this.cdr.markForCheck();
  }

  isFiltered(): boolean {
    return !!(
      this.filterSearch ||
      this.filterStatuses.length > 0 ||
      this.filterPriorities.length > 0 ||
      this.filterCreatedFrom ||
      this.filterCreatedTo ||
      this.filterRiskMin !== null ||
      this.filterRiskMax !== null
    );
  }

  getFilterSummary(): string {
    const parts: string[] = [];
    if (this.filterSearch) {
      parts.push(`Search: "${this.filterSearch}"`);
    }
    if (this.filterStatuses.length) {
      parts.push(`Status: ${this.filterStatuses.join(', ')}`);
    }
    if (this.filterPriorities.length) {
      parts.push(`Priority: ${this.filterPriorities.join(', ')}`);
    }
    if (this.filterCreatedFrom || this.filterCreatedTo) {
      parts.push(`Created: ${this.filterCreatedFrom || 'Any'} → ${this.filterCreatedTo || 'Any'}`);
    }
    if (this.filterRiskMin !== null || this.filterRiskMax !== null) {
      parts.push(`Risk: ${this.filterRiskMin ?? 0}% → ${this.filterRiskMax ?? 100}%`);
    }
    return parts.join(' • ');
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadClients();
    this.closeFilterModal();
  }

  clearFilters(): void {
    this.filterSearch = '';
    this.filterStatuses = [];
    this.filterPriorities = [];
    this.filterCreatedFrom = '';
    this.filterCreatedTo = '';
    this.filterRiskMin = null;
    this.filterRiskMax = null;
    this.currentPage = 0;
    this.loadClients();
    this.closeFilterModal();
  }

  toggleFilterValue(list: string[], value: string): void {
    const index = list.indexOf(value);
    if (index === -1) {
      list.push(value);
    } else {
      list.splice(index, 1);
    }
    this.cdr.markForCheck();
  }

  onSortChange(sortBy: string): void {
    if (this.sortBy === sortBy) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortDirection = 'desc';
    }
    this.currentPage = 0;
    this.loadClients();
  }

  onPageChange(page: number): void {
    if (page < 0 || page >= this.totalPages) {
      return;
    }
    this.currentPage = page;
    this.loadClients();
  }

  onPageSizeChange(): void {
    this.currentPage = 0;
    this.loadClients();
  }

  viewClientDetails(client: AgentClient): void {
    this.showViewClientModal = true;
    this.selectedClient = client;
    this.cdr.markForCheck();

    this.api.getClientDetails(client.userId)
      .pipe(finalize(() => this.cdr.markForCheck()))
      .subscribe({
        next: (details) => {
          this.selectedClient = { ...client, ...details };
        },
        error: (err) => {
          this.notify.error('Error', 'Failed to load client details.');
          this.closeViewClientModal();
        }
      });
  }

  closeViewClientModal(): void {
    this.showViewClientModal = false;
    this.selectedClient = null;
    this.cdr.markForCheck();
  }

  openConfirm(actionType: 'approve' | 'suspend' | 'reject', client: AgentClient): void {
    this.confirmActionType = actionType;
    this.selectedActionClient = client;
    this.confirmReason = '';
    this.confirmModalOpen = true;
    this.cdr.markForCheck();
  }

  closeConfirm(): void {
    this.confirmModalOpen = false;
    this.selectedActionClient = null;
    this.confirmReason = '';
    this.cdr.markForCheck();
  }

  confirmAction(): void {
    if (!this.selectedActionClient || !this.confirmActionType) {
      return;
    }

    this.actionLoadingId = this.selectedActionClient.userId;
    this.cdr.markForCheck();

    let actionCall = this.api.approveClient(this.selectedActionClient.userId);
    let successMessage = 'Client updated successfully.';

    if (this.confirmActionType === 'suspend') {
      actionCall = this.api.suspendClient(this.selectedActionClient.userId, this.confirmReason || undefined);
      successMessage = 'Client suspended successfully.';
    } else if (this.confirmActionType === 'reject') {
      actionCall = this.api.rejectClient(this.selectedActionClient.userId, this.confirmReason || undefined);
      successMessage = 'Client rejected successfully.';
    }

    actionCall.pipe(finalize(() => {
      this.actionLoadingId = null;
      this.closeConfirm();
      this.cdr.markForCheck();
    }))
    .subscribe({
      next: () => {
        this.notify.success('Success', successMessage);
        this.loadClients();
      },
      error: (err) => {
        this.notify.error('Error', err?.error?.message || 'Unable to perform this action.');
      }
    });
  }

  createClient(): void {
    this.showAddClientModal = true;
    this.addClientError = null;
    this.addClientSuccess = false;
    this.newClientForm = {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      status: 'ACTIVE',
      dateOfBirth: '',
      address: '',
      gender: ''
    };
    this.cdr.markForCheck();
  }

  closeAddClientModal(): void {
    this.showAddClientModal = false;
    this.addClientError = null;
    this.addClientSuccess = false;
    this.cdr.markForCheck();
  }

  validateAddClientForm(): string | null {
    if (!this.newClientForm.firstName?.trim()) {
      return 'First name is required.';
    }
    if (!this.newClientForm.lastName?.trim()) {
      return 'Last name is required.';
    }
    if (!this.newClientForm.email?.trim()) {
      return 'Email is required.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.newClientForm.email)) {
      return 'Please enter a valid email address.';
    }
    if (!this.newClientForm.phoneNumber?.trim()) {
      return 'Phone number is required.';
    }
    if (!this.newClientForm.password) {
      return 'Password is required.';
    }
    if (this.newClientForm.password.length < 8) {
      return 'Password must be at least 8 characters long.';
    }
    return null;
  }

  submitAddClient(): void {
    const validationError = this.validateAddClientForm();
    if (validationError) {
      this.addClientError = validationError;
      this.cdr.markForCheck();
      return;
    }

    this.addClientLoading = true;
    this.addClientError = null;
    this.cdr.markForCheck();

    this.api.createClient(this.newClientForm as Partial<AgentClient>)
      .pipe(finalize(() => {
        this.addClientLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.notify.success('Success', 'Client created successfully!');
          this.closeAddClientModal();
          this.currentPage = 0;
          this.loadClients();
        },
        error: (err) => {
          const errMessage = err?.error?.message || 'Failed to create client.';
          this.addClientError = errMessage;
        }
      });
  }

  editClient(client: AgentClient): void {
    this.notify.info('Info', 'Edit client flow is not available in this view yet.');
  }

  getStatusBadgeClass(status: string): string {
    if (!status) {
      return 'status-unknown';
    }
    return `status-${status.toLowerCase().replace(/_/g, '-')}`;
  }

  getPriorityClass(score?: number): string {
    if (score === undefined || score === null) {
      return 'priority-low';
    }
    if (score >= 80) {
      return 'priority-high';
    }
    if (score >= 50) {
      return 'priority-medium';
    }
    return 'priority-low';
  }

  getPriorityLabel(score?: number): string {
    if (score === undefined || score === null) {
      return 'LOW';
    }
    if (score >= 80) {
      return 'HIGH';
    }
    if (score >= 50) {
      return 'MEDIUM';
    }
    return 'LOW';
  }
}
