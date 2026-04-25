import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminApi } from '../../data-access/admin.api';
import { UserActivity, UserRole } from '../../models/admin.model';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, NgFor, NgIf],
  templateUrl: './admin-audit-page.component.html',
  styleUrl: './admin-audit-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminAuditPageComponent implements OnInit {
  private readonly api = inject(AdminApi);
  private readonly cdr = inject(ChangeDetectorRef);

  activities: UserActivity[] = [];
  filteredActivities: UserActivity[] = [];
  loading = false;
  error: string | null = null;
  roleFilter: UserRole | '' = '';
  searchUserId = '';
  actionType = '';
  fromDate = '';
  toDate = '';
  page = 0;
  size = 20;
  totalElements = 0;
  actionTypes: string[] = [];

  ngOnInit(): void {
    this.loadActivities();
  }

  loadActivities(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    const userId = this.searchUserId ? Number(this.searchUserId) : undefined;

    this.api.getActivities(
      this.roleFilter || undefined,
      this.actionType || undefined,
      userId,
      this.fromDate || undefined,
      this.toDate || undefined,
      this.page,
      this.size
    )
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: result => {
          this.activities = result.content ?? [];
          this.totalElements = result.totalElements ?? 0;
          this.actionTypes = Array.from(new Set(this.activities.map(a => a.actionType ?? ''))).filter(value => !!value);
          this.applyFilters();
          this.cdr.markForCheck();
        },
        error: () => {
          this.error = 'Impossible de charger les logs d’audit.';
          this.activities = [];
          this.filteredActivities = [];
          this.cdr.markForCheck();
        }
      });
  }

  applyFilters(): void {
    this.filteredActivities = this.activities.filter(activity => {
      const matchesUser = this.searchUserId ? activity.userId?.toString().includes(this.searchUserId) : true;
      const matchesAction = this.actionType ? activity.actionType === this.actionType : true;
      const date = activity.timestamp ? new Date(activity.timestamp) : null;
      const matchesFrom = this.fromDate && date ? date >= new Date(this.fromDate) : true;
      const matchesTo = this.toDate && date ? date <= new Date(this.toDate) : true;
      return matchesUser && matchesAction && matchesFrom && matchesTo;
    });
    this.cdr.markForCheck();
  }

  goToPage(page: number): void {
    if (page < 0 || page >= Math.ceil(this.totalElements / this.size)) return;
    this.page = page;
    this.loadActivities();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalElements / this.size));
  }

  getSeverity(actionType?: string): string {
    if (!actionType) return 'INFO';
    if (actionType.toLowerCase().includes('delete') || actionType.toLowerCase().includes('reject')) return 'CRITICAL';
    if (actionType.toLowerCase().includes('block') || actionType.toLowerCase().includes('suspend')) return 'WARNING';
    return 'INFO';
  }
}
