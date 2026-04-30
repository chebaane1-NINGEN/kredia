import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AgentApi } from '../../data-access/agent.api';
import { AgentActivity } from '../../models/agent.model';
import { PageResponse } from '../../../admin/models/admin.model';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agent-audit-page.component.html',
  styleUrl: './agent-audit-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AgentAuditPageComponent implements OnInit, OnDestroy {
  private readonly api = inject(AgentApi);
  private readonly cdr = inject(ChangeDetectorRef);

  activities: AgentActivity[] = [];
  loading = true;
  error: string | null = null;

  // Filters
  selectedAction = '';
  searchTerm = '';
  clientIdFilter: number | null = null;
  fromDate = '';
  toDate = '';
  private refreshTimer: number | null = null;

  // Pagination
  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;
  selectedActivity: AgentActivity | null = null;

  ngOnInit(): void {
    this.loadActivities();
    this.refreshTimer = window.setInterval(() => this.loadActivities(false), 15000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) {
      window.clearInterval(this.refreshTimer);
    }
  }

  loadActivities(showLoading = true): void {
    this.loading = showLoading;
    this.error = null;
    this.cdr.markForCheck();

    this.api.getActivity(this.currentPage, this.pageSize, {
      actionType: this.selectedAction || undefined,
      clientId: this.clientIdFilter || undefined,
      fromDate: this.fromDate || undefined,
      toDate: this.toDate || undefined,
      search: this.searchTerm || undefined
    })
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (response: PageResponse<AgentActivity>) => {
          this.activities = response.content || [];
          this.totalPages = response.totalPages || 0;
          this.totalElements = response.totalElements || 0;
        },
        error: (err) => {
          this.error = 'Failed to load activity log';
          console.error('Activity error:', err);
        }
      });
  }

  onPageChange(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadActivities();
    }
  }

  getActivityIcon(actionType: string): string {
    switch (actionType) {
      case 'LOGIN': return '🔑';
      case 'APPROVAL': return '✅';
      case 'REJECTION': return '⛔';
      case 'CREATED': return '＋';
      case 'CLIENT_HANDLED': return '👥';
      case 'STATUS_CHANGED': return '🔄';
      case 'CLIENT_SUSPENDED': return '⏸';
      default: return '📝';
    }
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadActivities();
  }

  clearFilters(): void {
    this.selectedAction = '';
    this.searchTerm = '';
    this.clientIdFilter = null;
    this.fromDate = '';
    this.toDate = '';
    this.applyFilters();
  }

  openActivityDetails(activity: AgentActivity): void {
    this.selectedActivity = activity;
    this.cdr.markForCheck();
  }

  closeActivityDetails(): void {
    this.selectedActivity = null;
    this.cdr.markForCheck();
  }

  getFilteredActivities(): AgentActivity[] {
    return this.activities;
  }
}
