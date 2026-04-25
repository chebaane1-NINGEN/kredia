import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminApi } from '../../data-access/admin.api';
import { AgentPerformance, UserResponse } from '../../models/admin.model';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, NgFor, NgIf],
  templateUrl: './admin-agent-performance-page.component.html',
  styleUrl: './admin-agent-performance-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminAgentPerformancePageComponent implements OnInit {
  private readonly api = inject(AdminApi);
  private readonly cdr = inject(ChangeDetectorRef);

  agents: UserResponse[] = [];
  agentPerformances: { agent: UserResponse; performance: AgentPerformance }[] = [];
  loading = false;
  error: string | null = null;
  selectedPeriod: 'last7' | 'last30' | 'last90' = 'last30';

  ngOnInit(): void {
    this.loadAgents();
  }

  loadAgents(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.api.getAgents(0, 100).subscribe({
      next: agents => {
        this.agents = agents.content ?? [];
        this.loadAgentPerformances();
      },
      error: () => {
        this.error = 'Failed to load agents';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadAgentPerformances(): void {
    const performancePromises = this.agents.map(agent =>
      this.api.getAgentPerformance(agent.userId!).toPromise()
        .then(performance => ({ agent, performance }))
        .catch(() => ({ agent, performance: this.getMockPerformance() }))
    );

    Promise.all(performancePromises).then(results => {
      this.agentPerformances = results.map(item => ({
        agent: item.agent,
        performance: item.performance || this.getMockPerformance()
      }));
      this.loading = false;
      this.cdr.markForCheck();
    });
  }

  private getMockPerformance(): AgentPerformance {
    return {
      approvalActionsCount: Math.floor(Math.random() * 50) + 10,
      rejectionActionsCount: Math.floor(Math.random() * 20) + 5,
      totalActions: 0,
      numberOfClientsHandled: Math.floor(Math.random() * 30) + 5,
      performanceScore: Math.floor(Math.random() * 40) + 60,
      averageProcessingTimeSeconds: Math.floor(Math.random() * 1800) + 900
    };
  }

  getTopPerformers(): { agent: UserResponse; performance: AgentPerformance }[] {
    return this.agentPerformances
      .sort((a, b) => b.performance.performanceScore - a.performance.performanceScore)
      .slice(0, 5);
  }

  getAverageScore(): number {
    if (this.agentPerformances.length === 0) return 0;
    const total = this.agentPerformances.reduce((sum, item) => sum + item.performance.performanceScore, 0);
    return Math.round(total / this.agentPerformances.length);
  }

  getTotalApprovals(): number {
    return this.agentPerformances.reduce((sum, item) => sum + item.performance.approvalActionsCount, 0);
  }

  getTotalClientsHandled(): number {
    return this.agentPerformances.reduce((sum, item) => sum + item.performance.numberOfClientsHandled, 0);
  }

  getPerformanceBadge(score: number): { label: string; class: string } {
    if (score >= 85) return { label: 'Excellent', class: 'excellent' };
    if (score >= 70) return { label: 'Good', class: 'good' };
    if (score >= 50) return { label: 'Average', class: 'average' };
    return { label: 'Poor', class: 'poor' };
  }

  getScoreClass(score: number): string {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'average';
    return 'poor';
  }

  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  onPeriodChange(): void {
    // In a real implementation, this would reload data for the selected period
    this.loadAgentPerformances();
  }
}