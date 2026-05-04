import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AuditService, AuditLogDTO, AuditLogFilter, AuditLogSummary } from '../../../../core/services/audit.service';

@Component({
  selector: 'app-admin-audit-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-audit-page.component.html',
  styleUrls: ['./admin-audit-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminAuditPageComponent implements OnInit {
  auditLogs: AuditLogDTO[] = [];
  summary: AuditLogSummary | null = null;
  selectedLog: AuditLogDTO | null = null;
  showDetailsModal = false;
  showFiltersModal = false;
  loading = false;
  error: string | null = null;

  currentPage = 0;
  totalPages = 0;
  totalElements = 0;

  filters: AuditLogFilter = {
    page: 0,
    pageSize: 20,
    sortBy: 'timestamp',
    sortDirection: 'DESC'
  };

  // Modal filter form
  filterForm!: FormGroup;

  constructor(
    private auditService: AuditService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeFilterForm();
    this.loadData();
  }

  private initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      actionType: [''],
      severity: [''],
      status: [''],
      startDate: [''],
      endDate: [''],
      actorId: [''],
      ipAddress: ['']
    });
  }

  private loadData(): void {
    this.loading = true;
    this.error = null;

    // Run both requests in parallel
    Promise.all([
      this.loadSummaryAsync(),
      this.loadAuditLogsAsync()
    ]).finally(() => {
      this.loading = false;
      this.cdr.markForCheck();
    });
  }

  private loadSummaryAsync(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.auditService.getAuditSummary().subscribe({
        next: (summary) => {
          this.summary = summary;
          resolve();
        },
        error: (error) => {
          console.error('Failed to load audit summary:', error);
          this.error = 'Failed to load summary metrics';
          resolve();
        }
      });
    });
  }

  private loadAuditLogsAsync(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.auditService.getAuditLogs(this.filters).subscribe({
        next: (response) => {
          this.auditLogs = response.content || [];
          this.currentPage = this.filters.page || 0;
          this.totalPages = response.totalPages || 0;
          this.totalElements = response.totalElements || 0;
          this.error = null;
          resolve();
        },
        error: (error) => {
          console.error('Failed to load audit logs:', error);
          this.auditLogs = [];
          this.error = 'Failed to load audit logs';
          resolve();
        }
      });
    });
  }

  openFiltersModal(): void {
    this.showFiltersModal = true;
  }

  closeFiltersModal(): void {
    this.showFiltersModal = false;
  }

  applyFilters(): void {
    const formValues = this.filterForm.value;
    
    // Update filters with form values
    this.filters = {
      ...this.filters,
      page: 0,
      actionType: formValues.actionType || undefined,
      severity: formValues.severity || undefined,
      status: formValues.status || undefined,
      startDate: formValues.startDate || undefined,
      endDate: formValues.endDate || undefined,
      actorId: formValues.actorId ? parseInt(formValues.actorId, 10) : undefined,
      ipAddress: formValues.ipAddress || undefined
    };

    this.closeFiltersModal();
    this.loadData();
    this.cdr.markForCheck();
  }

  resetFilters(): void {
    this.filters = {
      page: 0,
      pageSize: 20,
      sortBy: 'timestamp',
      sortDirection: 'DESC'
    };
    
    this.filterForm.reset();
    this.closeFiltersModal();
    this.loadData();
    this.cdr.markForCheck();
  }

  sortBy(field: string): void {
    if (this.filters.sortBy === field) {
      this.filters.sortDirection = this.filters.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.filters.sortBy = field;
      this.filters.sortDirection = 'ASC';
    }
    this.applyFilters();
  }

  goToPage(page: number): void {
    this.filters.page = page;
    this.loadAuditLogsAsync().then(() => this.cdr.markForCheck());
  }

  changePageSize(): void {
    this.filters.page = 0;
    this.loadAuditLogsAsync().then(() => this.cdr.markForCheck());
  }

  selectLog(log: AuditLogDTO): void {
    this.selectedLog = log;
  }

  viewDetails(log: AuditLogDTO): void {
    this.selectedLog = log;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedLog = null;
  }

  getModuleFromLog(log: AuditLogDTO): string {
    const moduleField = log?.requestData?.module || log?.responseData?.module;
    if (typeof moduleField === 'string' && moduleField.trim().length > 0) {
      return moduleField;
    }

    return this.deriveModuleFromAction(log?.actionType);
  }

  private deriveModuleFromAction(actionType?: string): string {
    if (!actionType) {
      return 'Unknown';
    }

    if (actionType.startsWith('CREATE_CREDIT') || actionType.startsWith('UPDATE_CREDIT') || actionType === 'DELETE_CREDIT' || actionType === 'APPROVE_CREDIT' || actionType === 'REJECT_CREDIT') {
      return 'Credit Management';
    }
    if (actionType.startsWith('CREATE_TRANSACTION') || actionType.startsWith('UPDATE_TRANSACTION') || actionType === 'DELETE_TRANSACTION' || actionType === 'REVERSE_TRANSACTION') {
      return 'Transaction Management';
    }
    if (actionType === 'LOGIN' || actionType === 'LOGOUT' || actionType === 'RESET_PASSWORD' || actionType === 'CHANGE_PERMISSIONS' || actionType === 'UPDATE_USER' || actionType === 'DELETE_USER' || actionType === 'CREATE_USER') {
      return 'User Management';
    }
    if (actionType === 'VIEW' || actionType === 'GENERATE_REPORT' || actionType === 'VIEW_ANALYTICS') {
      return 'Analytics';
    }
    if (actionType === 'MODIFY_SETTINGS' || actionType === 'SYSTEM_CONFIG_CHANGE' || actionType === 'IMPORT_DATA' || actionType === 'EXPORT_DATA') {
      return 'Settings';
    }
    return 'General';
  }

  getActionClass(actionType: string): string {
    const actionClasses: { [key: string]: string } = {
      'LOGIN': 'login',
      'LOGOUT': 'logout',
      'CREATE_USER': 'create',
      'UPDATE_USER': 'update',
      'DELETE_USER': 'delete',
      'CREATE_CREDIT': 'create',
      'UPDATE_CREDIT': 'update',
      'DELETE_CREDIT': 'delete',
      'CREATE_TRANSACTION': 'create',
      'UPDATE_TRANSACTION': 'update',
      'DELETE_TRANSACTION': 'delete'
    };
    return actionClasses[actionType] || 'default';
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'SUCCESS': 'success',
      'FAILED': 'failed',
      'PARTIAL': 'partial',
      'PENDING': 'pending'
    };
    return statusClasses[status] || 'default';
  }

  getSeverityClass(severity: string): string {
    const severityClasses: { [key: string]: string } = {
      'LOW': 'low',
      'MEDIUM': 'medium',
      'HIGH': 'high',
      'CRITICAL': 'critical'
    };
    return severityClasses[severity] || 'default';
  }

  getFilterSummary(): string {
    const activeFilters: string[] = [];
    if (this.filters.actionType) activeFilters.push(`Action: ${this.filters.actionType}`);
    if (this.filters.severity) activeFilters.push(`Severity: ${this.filters.severity}`);
    if (this.filters.status) activeFilters.push(`Status: ${this.filters.status}`);
    if (this.filters.startDate) activeFilters.push(`From: ${this.filters.startDate}`);
    if (this.filters.endDate) activeFilters.push(`To: ${this.filters.endDate}`);
    if (this.filters.actorId) activeFilters.push(`Actor: ${this.filters.actorId}`);
    if (this.filters.ipAddress) activeFilters.push(`IP: ${this.filters.ipAddress}`);
    
    return activeFilters.length > 0 ? activeFilters.join(' | ') : 'No filters active';
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.actionType || this.filters.severity || this.filters.status || 
              this.filters.startDate || this.filters.endDate || this.filters.actorId || 
              this.filters.ipAddress);
  }
}
