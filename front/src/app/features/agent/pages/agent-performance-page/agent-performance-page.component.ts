import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { AgentApi } from '../../data-access/agent.api';
import { AgentPerformance, ApprovalTrendPoint, PerformanceTrendPoint } from '../../models/agent.model';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agent-performance-page.component.html',
  styleUrl: './agent-performance-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AgentPerformancePageComponent implements OnInit {
  private readonly api = inject(AgentApi);
  private readonly cdr = inject(ChangeDetectorRef);

  performance: AgentPerformance | null = null;
  loading = true;
  error: string | null = null;
  displayedScore = 0;

  ngOnInit(): void {
    this.loadPerformance();
  }

  loadPerformance(): void {
    this.loading = true;
    this.error = null;
    this.performance = null;
    this.displayedScore = 0;
    this.cdr.markForCheck();

    this.api.getPerformance()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (data) => {
          this.performance = data;
          this.animateScore();
        },
        error: (err) => {
          this.error = 'Failed to load performance data';
          console.error('Performance error:', err);
        }
      });
  }

  getPerformanceBadge(): string {
    if (!this.performance) return 'Unknown';

    const score = this.performance.performanceScore;
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Average';
    return 'Needs Improvement';
  }

  getPerformanceColor(): string {
    if (!this.performance) return '#gray';

    const score = this.performance.performanceScore;
    if (score >= 90) return '#10B981'; // green
    if (score >= 75) return '#3B82F6'; // blue
    if (score >= 60) return '#F59E0B'; // yellow
    return '#EF4444'; // red
  }

  getScoreDeltaLabel(): string {
    if (!this.performance) return '';
    const delta = this.performance.scoreChangeFromLastWeek ?? 0;
    return delta >= 0 ? `+${delta.toFixed(2)}% vs last week` : `${delta.toFixed(2)}% vs last week`;
  }

  formatDuration(seconds: number): string {
    if (!seconds || seconds <= 0) {
      return 'N/A';
    }
    const minutes = Math.floor(seconds / 60);
    const remaining = Math.floor(seconds % 60);
    return `${minutes}m ${remaining}s`;
  }

  getTrendMax(trend: PerformanceTrendPoint[] | ApprovalTrendPoint[] = []): number {
    return trend.reduce((max, point) => {
      const values = 'actions' in point
        ? Math.max(point.actions, point.approvals)
        : Math.max(point.approvals, point.rejections);
      return Math.max(max, values);
    }, 0);
  }

  trackByDate(index: number, item: { date: string }): string {
    return item.date;
  }

  private animateScore(): void {
    if (!this.performance) return;
    const target = Math.round(this.performance.performanceScore);
    const step = Math.max(1, Math.floor(target / 20));
    let current = 0;

    const interval = window.setInterval(() => {
      current += step;
      if (current >= target) {
        this.displayedScore = target;
        window.clearInterval(interval);
      } else {
        this.displayedScore = current;
      }
      this.cdr.markForCheck();
    }, 16);
  }
}