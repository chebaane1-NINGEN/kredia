import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
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
export class AgentAuditPageComponent implements OnInit {
  private readonly api = inject(AgentApi);
  private readonly cdr = inject(ChangeDetectorRef);

  activities: AgentActivity[] = [];
  loading = true;
  error: string | null = null;

  // Filters
  selectedAction = '';
  searchTerm = '';
  showClientOnly = true; // Default to showing only client-related activities

  // Pagination
  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;

  ngOnInit(): void {
    this.loadActivities();
  }

  loadActivities(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.api.getActivity(this.currentPage, this.pageSize)
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
      case 'CLIENT_HANDLED': return '👥';
      case 'STATUS_CHANGED': return '🔄';
      default: return '📝';
    }
  }

  getFilteredActivities(): AgentActivity[] {
    return this.activities.filter(activity => {
      const matchesAction = !this.selectedAction || activity.actionType === this.selectedAction;
      const matchesSearch = !this.searchTerm ||
        activity.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (activity.userName && activity.userName.toLowerCase().includes(this.searchTerm.toLowerCase()));
      const matchesClientFilter = !this.showClientOnly ||
        activity.actionType === 'APPROVAL' ||
        activity.actionType === 'CLIENT_HANDLED' ||
        activity.actionType === 'STATUS_CHANGED' ||
        activity.description.toLowerCase().includes('client');
      return matchesAction && matchesSearch && matchesClientFilter;
    });
  }
}