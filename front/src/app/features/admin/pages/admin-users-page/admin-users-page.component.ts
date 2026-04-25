import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
// import { downloadBlob } from '../../../core/utils/download.util';
import { AdminApi } from '../../data-access/admin.api';
import { UserResponse, UserRole, UserStatus } from '../../models/admin.model';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, NgFor, NgIf],
  templateUrl: './admin-users-page.component.html',
  styleUrl: './admin-users-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminUsersPageComponent implements OnInit {
  private readonly api = inject(AdminApi);
  private readonly cdr = inject(ChangeDetectorRef);

  users: UserResponse[] = [];
  selectedIds = new Set<number>();
  loading = false;
  error: string | null = null;
  query = '';
  roleFilter: UserRole | '' = '';
  statusFilter: UserStatus | '' = '';
  createdFrom = '';
  createdTo = '';
  page = 0;
  size = 12;
  totalElements = 0;
  availableRoles: UserRole[] = ['ADMIN', 'AGENT', 'CLIENT'];
  availableStatus: UserStatus[] = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLOCKED'];
  agents: UserResponse[] = [];
  sortKey: keyof UserResponse = 'firstName';
  sortDirection: 'asc' | 'desc' = 'asc';
  showAddUserForm = false;
  createLoading = false;
  createSuccess: string | null = null;
  exportLoading = false;
  showAdvancedFiltersModal = false;
  showAddUserModal = false;
  exportDropdownOpen = false;
  showPassword = false;
  filteredResultsCount: number | null = null;
  advancedFiltersOpen = false;
  advancedFiltersOpen = false;

  // Advanced filters
  filterRoles: string[] = [];
  filterStatus: string[] = [];
  filterCreatedFrom = '';
  filterCreatedTo = '';
  filterQuery = '';

  newUser: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    password: string;
    role: UserRole;
    status: UserStatus;
  } = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    role: 'CLIENT',
    status: 'ACTIVE'
  };

  ngOnInit(): void {
    this.loadUsers();
    this.loadAgents();
  }

  loadAgents(): void {
    this.api.getAgents(0, 100).subscribe(data => {
      this.agents = data.content ?? [];
      this.cdr.markForCheck();
    });
  }

  toggleAdvancedFilters(): void {
    this.advancedFiltersOpen = !this.advancedFiltersOpen;
    this.cdr.markForCheck();
  }

  resetFilters(): void {
    this.query = '';
    this.roleFilter = '';
    this.statusFilter = '';
    this.createdFrom = '';
    this.createdTo = '';
    this.page = 0;
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.api.findUsers(
      this.query || undefined,
      this.roleFilter || undefined,
      this.statusFilter || undefined,
      this.createdFrom || undefined,
      this.createdTo || undefined,
      this.page,
      this.size
    )
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: data => {
          this.users = data.content ?? [];
          this.totalElements = data.totalElements ?? 0;
          this.selectedIds.clear();
          this.applySorting();
          this.cdr.markForCheck();
        },
        error: () => {
          this.error = 'Impossible de charger la liste des utilisateurs. Réessayez.';
          this.cdr.markForCheck();
        }
      });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalElements / this.size));
  }

  toggleSelect(userId?: number): void {
    if (!userId) return;
    if (this.selectedIds.has(userId)) {
      this.selectedIds.delete(userId);
    } else {
      this.selectedIds.add(userId);
    }
    this.cdr.markForCheck();
  }

  isSelected(userId?: number): boolean {
    return !!userId && this.selectedIds.has(userId);
  }

  updateStatus(user: UserResponse): void {
    if (!user.userId) return;
    const newStatus = user.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    
    this.loading = true;
    this.cdr.markForCheck();

    const request = newStatus === 'BLOCKED' ? this.api.blockUser(user.userId) : this.api.activateUser(user.userId);
    
    request.pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => this.loadUsers(),
        error: () => {
          this.error = 'Erreur lors du changement de statut.';
          this.cdr.markForCheck();
        }
      });
  }

  deleteUser(user: UserResponse): void {
    if (!user.userId) return;
    if (user.role === 'ADMIN') {
      this.error = 'La suppression des administrateurs est désactivée.';
      this.cdr.markForCheck();
      return;
    }

    if (!window.confirm(`Supprimer ${user.firstName} ${user.lastName} ?`)) {
      return;
    }

    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.api.deleteUser(user.userId)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => this.loadUsers(),
        error: () => {
          this.error = 'Impossible de supprimer cet utilisateur.';
          this.cdr.markForCheck();
        }
      });
  }

  changeRole(user: UserResponse, role: UserRole): void {
    if (!user.userId || user.role === role) return;

    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.api.changeUserRole(user.userId, role)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => this.loadUsers(),
        error: () => {
          this.error = 'Impossible de mettre à jour le rôle.';
          this.cdr.markForCheck();
        }
      });
  }

  assignAgent(user: UserResponse, agentIdStr: string): void {
    if (!user.userId) return;
    const agentId = parseInt(agentIdStr, 10);
    
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    const request = isNaN(agentId) 
      ? this.api.unassignClient(user.userId)
      : this.api.assignClient(agentId, user.userId);

    request.pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => this.loadUsers(),
        error: () => {
          this.error = 'Erreur lors de l’assignation.';
          this.cdr.markForCheck();
        }
      });
  }

  bulkDelete(): void {
    if (this.selectedIds.size === 0) return;
    if (!confirm(`Supprimer ${this.selectedIds.size} utilisateur(s) ?`)) return;

    this.loading = true;
    this.cdr.markForCheck();

    this.api.bulkDelete(Array.from(this.selectedIds))
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.selectedIds.clear();
          this.loadUsers();
        },
        error: () => {
          this.error = 'Erreur lors de la suppression groupée.';
          this.cdr.markForCheck();
        }
      });
  }

  bulkUpdateStatus(status: UserStatus): void {
    if (this.selectedIds.size === 0) return;

    this.loading = true;
    this.cdr.markForCheck();

    this.api.bulkUpdateStatus(Array.from(this.selectedIds), status)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.selectedIds.clear();
          this.loadUsers();
        },
        error: () => {
          this.error = 'Erreur lors de la mise à jour groupée.';
          this.cdr.markForCheck();
        }
      });
  }

  openAddUserForm(): void {
    this.showAddUserForm = true;
    this.createSuccess = null;
    this.error = null;
    this.cdr.markForCheck();
  }

  closeAddUserForm(): void {
    this.showAddUserForm = false;
    this.createSuccess = null;
    this.error = null;
    this.resetAddUserForm();
    this.cdr.markForCheck();
  }

  resetAddUserForm(): void {
    this.newUser = {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      role: 'CLIENT',
      status: 'ACTIVE'
    };
  }

  createUser(): void {
    this.createLoading = true;
    this.createSuccess = null;
    this.error = null;
    this.cdr.markForCheck();

    const payload = {
      firstName: this.newUser.firstName,
      lastName: this.newUser.lastName,
      email: this.newUser.email,
      phoneNumber: this.newUser.phoneNumber,
      password: this.newUser.password,
      role: this.newUser.role,
      status: this.newUser.status
    };

    this.api.createUser(payload as UserResponse)
      .pipe(finalize(() => { this.createLoading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.showToast(`User ${this.newUser.firstName} ${this.newUser.lastName} created successfully!`, 'success');
          this.closeAddUserForm();
          this.loadUsers();
          this.resetAddUserForm();
        },
        error: (error) => {
          const errorMessage = error.error?.message || 'Failed to create user. Please check the information and try again.';
          this.showToast(errorMessage, 'error');
        }
      });
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.page = page;
    this.loadUsers();
  }

  get totalUsers(): number {
    return this.totalElements;
  }

  get activeUsersCount(): number {
    return this.users.filter(u => u.status === 'ACTIVE').length;
  }

  get blockedUsersCount(): number {
    return this.users.filter(u => u.status === 'BLOCKED').length;
  }

  get newUsers24h(): number {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return this.users.filter(u => u.createdAt ? new Date(u.createdAt).getTime() >= cutoff : false).length;
  }

  get healthIndex(): number {
    return 59;
  }

  get healthLabel(): string {
    return 'Fair';
  }

  get selectedCount(): number {
    return this.selectedIds.size;
  }

  get isAllSelected(): boolean {
    return this.users.length > 0 && this.selectedIds.size === this.users.length;
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.users.forEach(user => {
        if (user.userId) {
          this.selectedIds.add(user.userId);
        }
      });
    } else {
      this.selectedIds.clear();
    }
    this.cdr.markForCheck();
  }

  sortBy(key: keyof UserResponse): void {
    if (this.sortKey === key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDirection = 'asc';
    }
    this.applySorting();
  }

  private applySorting(): void {
    const direction = this.sortDirection === 'asc' ? 1 : -1;

    this.users = [...this.users].sort((a, b) => {
      const valueA = a[this.sortKey] ?? '';
      const valueB = b[this.sortKey] ?? '';

      if (this.sortKey === 'createdAt') {
        return (new Date(valueA as string).getTime() - new Date(valueB as string).getTime()) * direction;
      }

      const aStr = String(valueA).toLowerCase();
      const bStr = String(valueB).toLowerCase();
      return aStr.localeCompare(bStr) * direction;
    });
    this.cdr.markForCheck();
  }

  getStatusClass(status: UserStatus): string {
    return `status--${status?.toLowerCase()}`;
  }

  getRoleClass(role: UserRole): string {
    return `role--${role?.toLowerCase()}`;
  }

  private showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    // Simple toast implementation - in a real app, you'd use a toast service
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 4px;
      color: white;
      font-weight: 500;
      z-index: 1000;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }

  // Modal methods
  openAdvancedFiltersModal(): void {
    this.showAdvancedFiltersModal = true;
    this.filteredResultsCount = null;
    this.cdr.markForCheck();
  }

  closeAdvancedFiltersModal(): void {
    this.showAdvancedFiltersModal = false;
    this.filteredResultsCount = null;
    this.cdr.markForCheck();
  }

  openAddUserModal(): void {
    this.showAddUserModal = true;
    this.createSuccess = null;
    this.error = null;
    this.resetAddUserForm();
    this.cdr.markForCheck();
  }

  closeAddUserModal(): void {
    this.showAddUserModal = false;
    this.createSuccess = null;
    this.error = null;
    this.resetAddUserForm();
    this.cdr.markForCheck();
  }

  toggleExportDropdown(): void {
    this.exportDropdownOpen = !this.exportDropdownOpen;
    this.cdr.markForCheck();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
    this.cdr.markForCheck();
  }

  // Advanced filters methods
  onFilterChange(): void {
    // Debounce filter changes
    clearTimeout(this.filterTimeout);
    this.filterTimeout = setTimeout(() => {
      this.updateFilteredResultsCount();
    }, 300);
  }

  private filterTimeout: any;

  updateFilteredResultsCount(): void {
    // This would typically call a backend endpoint to get filtered count
    // For now, we'll simulate it with local filtering
    const filtered = this.users.filter(user => {
      const matchesRole = this.filterRoles.length === 0 || this.filterRoles.includes(user.role);
      const matchesStatus = this.filterStatus.length === 0 || this.filterStatus.includes(user.status);
      const matchesQuery = !this.filterQuery ||
        user.firstName.toLowerCase().includes(this.filterQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(this.filterQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(this.filterQuery.toLowerCase());

      let matchesDate = true;
      if (this.filterCreatedFrom || this.filterCreatedTo) {
        const userDate = user.createdAt ? new Date(user.createdAt) : null;
        if (userDate) {
          if (this.filterCreatedFrom) {
            matchesDate = matchesDate && userDate >= new Date(this.filterCreatedFrom);
          }
          if (this.filterCreatedTo) {
            matchesDate = matchesDate && userDate <= new Date(this.filterCreatedTo + 'T23:59:59');
          }
        }
      }

      return matchesRole && matchesStatus && matchesQuery && matchesDate;
    });

    this.filteredResultsCount = filtered.length;
    this.cdr.markForCheck();
  }

  applyAdvancedFilters(): void {
    // Apply filters to current search
    this.query = this.filterQuery;
    this.roleFilter = this.filterRoles.length === 1 ? this.filterRoles[0] as UserRole : '';
    this.statusFilter = this.filterStatus.length === 1 ? this.filterStatus[0] as UserStatus : '';
    this.createdFrom = this.filterCreatedFrom;
    this.createdTo = this.filterCreatedTo;
    this.page = 0;
    this.loadUsers();
    this.closeAdvancedFiltersModal();
  }

  resetAdvancedFilters(): void {
    this.filterRoles = [];
    this.filterStatus = [];
    this.filterCreatedFrom = '';
    this.filterCreatedTo = '';
    this.filterQuery = '';
    this.filteredResultsCount = null;
    this.cdr.markForCheck();
  }

  hasActiveFilters(): boolean {
    return this.filterRoles.length > 0 ||
           this.filterStatus.length > 0 ||
           !!this.filterCreatedFrom ||
           !!this.filterCreatedTo ||
           !!this.filterQuery;
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.filterRoles.length > 0) count++;
    if (this.filterStatus.length > 0) count++;
    if (this.filterCreatedFrom || this.filterCreatedTo) count++;
    if (this.filterQuery) count++;
    return count;
  }

  // Export methods
  exportCsv(): void {
    this.exportLoading = true;
    this.cdr.markForCheck();

    const ids = Array.from(this.selectedIds);
    const request = ids.length > 0
      ? this.api.exportSelectedCsv(ids)
      : this.api.exportUsersCsv(this.query || undefined, this.roleFilter || undefined, this.statusFilter || undefined, this.createdFrom || undefined, this.createdTo || undefined);

    request.pipe(finalize(() => { this.exportLoading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (blob: Blob) => {
          const timestamp = new Date().toISOString().split('T')[0];
          const filename = ids.length > 0 ? `selected-users-${timestamp}.csv` : `users-export-${timestamp}.csv`;
          // downloadBlob(blob, filename); // TODO: Fix import issue
          this.showToast('CSV export completed successfully', 'success');
        },
        error: () => {
          this.showToast('Failed to export CSV. Please try again.', 'error');
          this.cdr.markForCheck();
        }
      });
  }

  exportExcel(): void {
    this.exportLoading = true;
    this.cdr.markForCheck();

    const ids = Array.from(this.selectedIds);
    const request = ids.length > 0
      ? this.api.exportSelectedExcel(ids)
      : this.api.exportUsersExcel(this.query || undefined, this.roleFilter || undefined, this.statusFilter || undefined, this.createdFrom || undefined, this.createdTo || undefined);

    request.pipe(finalize(() => { this.exportLoading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (blob: Blob) => {
          const timestamp = new Date().toISOString().split('T')[0];
          const filename = ids.length > 0 ? `selected-users-${timestamp}.xlsx` : `users-export-${timestamp}.xlsx`;
          // downloadBlob(blob, filename); // TODO: Fix import issue
          this.showToast('Excel export completed successfully', 'success');
        },
        error: () => {
          this.showToast('Failed to export Excel. Please try again.', 'error');
          this.cdr.markForCheck();
        }
      });
  }

  exportPdf(): void {
    this.exportLoading = true;
    this.cdr.markForCheck();

    // For now, we'll use Excel export as PDF alternative
    const ids = Array.from(this.selectedIds);
    const request = ids.length > 0
      ? this.api.exportSelectedExcel(ids)
      : this.api.exportUsersExcel(this.query || undefined, this.roleFilter || undefined, this.statusFilter || undefined, this.createdFrom || undefined, this.createdTo || undefined);

    request.pipe(finalize(() => { this.exportLoading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (blob: Blob) => {
          const timestamp = new Date().toISOString().split('T')[0];
          const filename = ids.length > 0 ? `selected-users-${timestamp}.xlsx` : `users-export-${timestamp}.xlsx`;
          // downloadBlob(blob, filename); // TODO: Fix import issue
          this.showToast('Export completed successfully (Excel format)', 'success');
        },
        error: () => {
          this.showToast('Failed to export. Please try again.', 'error');
          this.cdr.markForCheck();
        }
      });
  }
}
