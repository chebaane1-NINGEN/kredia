import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AgentApi } from '../../data-access/agent.api';
import { AgentClient } from '../../models/agent.model';
import { PageResponse } from '../../../admin/models/admin.model';

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

  clients: AgentClient[] = [];
  loading = true;
  error: string | null = null;

  // Filters
  searchEmail = '';
  selectedStatus = '';
  sortBy = 'priorityScore'; // Default sort by priority
  sortDirection: 'asc' | 'desc' = 'desc'; // High priority first

  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.api.getClients(this.searchEmail || undefined, this.selectedStatus || undefined, this.currentPage, this.pageSize, this.sortBy, this.sortDirection)
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
          this.error = 'Failed to load clients';
          console.error('Clients error:', err);
        }
      });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadClients();
  }

  onStatusFilter(): void {
    this.currentPage = 0;
    this.loadClients();
  }

  onSortChange(sortBy: string): void {
    if (this.sortBy === sortBy) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortDirection = 'desc'; // Default to descending for new sort
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

  viewClientDetails(client: AgentClient): void {
    this.router.navigate(['/agent/clients', client.userId]);
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'ACTIVE': return '🟢';
      case 'INACTIVE': return '🟡';
      case 'SUSPENDED': return '🟠';
      case 'BLOCKED': return '🔴';
      default: return '⚪';
    }
  }

  getStatusBadgeClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  getPriorityClass(score?: number): string {
    if (!score) return 'priority-low';
    if (score >= 80) return 'priority-high';
    if (score >= 50) return 'priority-medium';
    return 'priority-low';
  }
}