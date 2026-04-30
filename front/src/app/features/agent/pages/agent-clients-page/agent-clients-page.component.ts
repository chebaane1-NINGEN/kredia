import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, inject, OnInit } from '@angular/core';
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
  templateUrl: './agent-clients-page.component.html',
  styleUrl: './agent-clients-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AgentClientsPageComponent implements OnInit {
  private readonly api = inject(AgentApi);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly notify = inject(NotificationService);

  clients: AgentClient[] = [];
  loading = true;
  error: string | null = null;
  actionLoadingId: number | null = null;

  // Filters
  searchEmail = '';
  selectedStatuses: string[] = [];
  selectedPriorities: string[] = [];
  availableStatuses = ['PENDING_VERIFICATION', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLOCKED'];
  availablePriorities = ['HIGH', 'MEDIUM', 'LOW'];
  startDate = '';
  endDate = '';
  sortBy = 'priorityScore';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Dropdown states
  statusDropdownOpen = false;
  priorityDropdownOpen = false;

  // Modal states
  showAddClientModal = false;
  showViewClientModal = false;
  showEditClientModal = false;
  addClientLoading = false;
  addClientError: string | null = null;
  viewClientLoading = false;
  editClientLoading = false;

  // Selected client for modals
  selectedClient: AgentClient | null = null;
  newClient: Partial<AgentClient> = {};

  // Pagination
  currentPage = 0;
  pageSize = 50;
  totalPages = 0;
  totalElements = 0;

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.api.getClients(
      this.searchEmail || undefined,
      this.selectedStatuses.length > 0 ? this.selectedStatuses.join(',') : undefined,
      this.currentPage,
      this.pageSize,
      this.sortBy,
      this.sortDirection,
      this.startDate || undefined,
      this.endDate || undefined,
      this.selectedPriorities.length > 0 ? this.selectedPriorities.join(',') : undefined
    )
    .pipe(finalize(() => {
      this.loading = false;
      this.cdr.markForCheck();
    }))
    .subscribe({
      next: (response: PageResponse<AgentClient>) => {
        this.clients = response.content || [];
        this.totalPages = response.totalPages || 0;
        this.totalElements = response.totalElements || 0;
      },
      error: (err) => {
        console.error('Load clients error:', err);
        this.error = this.getErrorMessage(err);
      }
    });
  }

  private getErrorMessage(err: any): string {
    if (err.error?.message) return err.error.message;
    if (err.status === 403) return 'Access denied. You do not have permission to view clients.';
    if (err.status === 404) return 'Clients endpoint not found.';
    return 'Failed to load clients. Please try again later.';
  }

  // Modal operations
  openAddClientModal(): void {
    this.showAddClientModal = true;
    this.newClient = { status: 'PENDING_VERIFICATION', role: 'CLIENT', priorityScore: 50 } as Partial<AgentClient>;
    this.addClientError = null;
    this.cdr.markForCheck();
  }

  closeAddClientModal(): void {
    this.showAddClientModal = false;
    this.addClientError = null;
    this.cdr.markForCheck();
  }

  onAddClientSubmit(formData: any): void {
    this.addClientLoading = true;
    this.addClientError = null;
    this.cdr.markForCheck();

    this.api.createClient(formData)
      .pipe(finalize(() => {
        this.addClientLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.notify.success('Success', 'Client added successfully');
          this.closeAddClientModal();
          this.currentPage = 0;
          this.loadClients();
        },
        error: (err) => {
          this.addClientError = err.error?.message || 'Failed to add client';
          console.error('Add client error:', err);
        }
      });
  }

  // Filter operations
  refreshClients(): void {
    this.currentPage = 0;
    this.loadClients();
  }

  clearFilters(): void {
    this.searchEmail = '';
    this.selectedStatuses = [];
    this.selectedPriorities = [];
    this.startDate = '';
    this.endDate = '';
    this.currentPage = 0;
    this.loadClients();
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadClients();
  }

  onStatusFilter(): void {
    this.currentPage = 0;
    this.loadClients();
  }

  onPriorityFilter(): void {
    this.currentPage = 0;
    this.loadClients();
  }

  onDateFilter(): void {
    this.currentPage = 0;
    this.loadClients();
  }

  toggleStatusDropdown(): void {
    this.statusDropdownOpen = !this.statusDropdownOpen;
    this.priorityDropdownOpen = false;
  }

  togglePriorityDropdown(): void {
    this.priorityDropdownOpen = !this.priorityDropdownOpen;
    this.statusDropdownOpen = false;
  }

  onStatusChange(status: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.selectedStatuses.push(status);
    } else {
      this.selectedStatuses = this.selectedStatuses.filter(s => s !== status);
    }
    this.onStatusFilter();
  }

  onPriorityChange(priority: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.selectedPriorities.push(priority);
    } else {
      this.selectedPriorities = this.selectedPriorities.filter(p => p !== priority);
    }
    this.onPriorityFilter();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.multi-select')) {
      this.statusDropdownOpen = false;
      this.priorityDropdownOpen = false;
    }
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
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadClients();
    }
  }

  // Client actions
  viewClientDetails(client: AgentClient): void {
    this.router.navigate(['/agent/clients', client.userId]);
  }

  approveClient(client: AgentClient, event: Event): void {
    event.stopPropagation();
    this.actionLoadingId = client.userId;
    this.cdr.markForCheck();

    this.api.approveClient(client.userId)
      .pipe(finalize(() => {
        this.actionLoadingId = null;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.notify.success('Success', `${client.firstName} approved successfully`);
          this.loadClients();
        },
        error: (err) => {
          this.notify.error('Error', 'Failed to approve client: ' + (err.error?.message || 'Unknown error'));
        }
      });
  }

  rejectClient(client: AgentClient, event: Event): void {
    event.stopPropagation();
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    this.actionLoadingId = client.userId;
    this.cdr.markForCheck();

    this.api.rejectClient(client.userId, reason)
      .pipe(finalize(() => {
        this.actionLoadingId = null;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.notify.success('Success', `${client.firstName} rejected`);
          this.loadClients();
        },
        error: (err) => {
          this.notify.error('Error', 'Failed to reject client: ' + (err.error?.message || 'Unknown error'));
        }
      });
  }

  getPriorityBadgeClass(score?: number): string {
    if (!score) return 'priority-unknown';
    if (score >= 80) return 'priority-high';
    if (score >= 50) return 'priority-medium';
    return 'priority-low';
  }

  getPriorityCategory(score?: number): string {
    if (!score) return 'LOW';
    if (score >= 80) return 'HIGH';
    if (score >= 50) return 'MEDIUM';
    return 'LOW';
  }

  getStatusBadgeClass(status: string): string {
    return `status-${status.toLowerCase().replace('_', '-')}`;
  }

  // Missing methods called from template
  createClient(): void {
    this.openAddClientModal();
  }

  getVisibleClients(): AgentClient[] {
    return this.clients.filter(client => {
      if (this.selectedPriorities.length === 0) {
        return true;
      }
      return this.selectedPriorities.includes(this.getPriorityCategory(client.priorityScore));
    });
  }

  getPriorityClass(score?: number): string {
    if (!score) return 'priority-low';
    if (score >= 80) return 'priority-high';
    if (score >= 50) return 'priority-medium';
    return 'priority-low';
  }

  editClient(client: AgentClient): void {
    this.selectedClient = { ...client };
    this.showEditClientModal = true;
    this.cdr.markForCheck();
  }

  suspendClient(client: AgentClient): void {
    if (!client.userId) return;
    const reason = prompt('Reason for suspension (optional):');
    this.actionLoadingId = client.userId;
    this.api.suspendClient(client.userId, reason || undefined)
      .pipe(finalize(() => {
        this.actionLoadingId = null;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => this.loadClients(),
        error: (err) => {
          this.error = 'Failed to suspend client';
          console.error('Suspend client error:', err);
        }
      });
  }

  submitAddClient(): void {
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.newClient.email || '');
    const passwordValid = !!this.newClient.password && this.newClient.password.length >= 8;
    if (!this.newClient.firstName || !this.newClient.lastName || !this.newClient.email || !this.newClient.phoneNumber || !emailValid || !passwordValid) {
      this.addClientError = 'First name, last name, valid email, phone number, and an 8+ character password are required.';
      return;
    }

    this.addClientLoading = true;
    this.addClientError = null;

    this.api.createClient(this.newClient)
      .pipe(finalize(() => {
        this.addClientLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.notify.success('Success', 'Client created and assigned to you');
          this.closeAddClientModal();
          this.newClient = {};
          this.currentPage = 0;
          this.loadClients();
        },
        error: (err) => {
          console.error('Create client error:', err);
          if (err.error && err.error.message) {
            this.addClientError = err.error.message;
          } else if (err.status === 400) {
            this.addClientError = 'Invalid client data. Please check the form and try again.';
          } else if (err.status === 409) {
            this.addClientError = 'A client with this email or phone number already exists.';
          } else if (err.status === 403) {
            this.addClientError = 'You do not have permission to create clients.';
          } else {
            this.addClientError = 'Failed to create client. Please try again later.';
          }
        }
      });
  }

  closeViewClientModal(): void {
    this.showViewClientModal = false;
    this.selectedClient = null;
    this.cdr.markForCheck();
  }

  closeEditClientModal(): void {
    this.showEditClientModal = false;
    this.selectedClient = null;
    this.cdr.markForCheck();
  }

  saveEditedClient(): void {
    if (!this.selectedClient || !this.selectedClient.userId) return;
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.selectedClient.email || '');
    if (!this.selectedClient.firstName || !this.selectedClient.lastName || !this.selectedClient.email || !emailValid) {
      this.notify.error('Validation', 'First name, last name, and a valid email are required');
      return;
    }

    this.editClientLoading = true;
    this.cdr.markForCheck();

    this.api.updateClient(this.selectedClient.userId, this.selectedClient)
      .pipe(finalize(() => {
        this.editClientLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.notify.success('Success', 'Client profile updated');
          this.closeEditClientModal();
          this.loadClients();
        },
        error: (err) => {
          this.notify.error('Error', 'Failed to update client: ' + (err.error?.message || 'Unknown error'));
        }
      });
  }
}
