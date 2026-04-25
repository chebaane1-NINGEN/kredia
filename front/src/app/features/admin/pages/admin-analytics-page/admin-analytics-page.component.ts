import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { AdminApi } from '../../data-access/admin.api';
import { AdminStats, SystemDashboardStats } from '../../models/admin.model';

interface KpiCard {
  title: string;
  value: number | string;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: string;
  description?: string;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    fill?: boolean;
  }[];
}

@Component({
  standalone: true,
  imports: [CommonModule, NgFor, NgIf],
  templateUrl: './admin-analytics-page.component.html',
  styleUrl: './admin-analytics-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminAnalyticsPageComponent implements OnInit {
  readonly Math = Math;
  private readonly api = inject(AdminApi);
  private readonly cdr = inject(ChangeDetectorRef);

  stats: AdminStats | null = null;
  systemStats: SystemDashboardStats | null = null;
  loading = false;
  error: string | null = null;
  selectedRange: 'last7' | 'last30' | 'last90' = 'last30';

  // Enhanced KPIs
  kpiCards: KpiCard[] = [];
  userGrowthChart: ChartData | null = null;
  roleDistributionChart: ChartData | null = null;
  activityChart: ChartData | null = null;
  approvalChart: ChartData | null = null;

  // Mock data for demonstration
  private mockUserGrowth = [
    { date: '2024-01-01', users: 120 },
    { date: '2024-01-02', users: 135 },
    { date: '2024-01-03', users: 142 },
    { date: '2024-01-04', users: 158 },
    { date: '2024-01-05', users: 167 },
    { date: '2024-01-06', users: 175 },
    { date: '2024-01-07', users: 189 },
    { date: '2024-01-08', users: 201 },
    { date: '2024-01-09', users: 218 },
    { date: '2024-01-10', users: 235 },
    { date: '2024-01-11', users: 248 },
    { date: '2024-01-12', users: 262 },
    { date: '2024-01-13', users: 278 },
    { date: '2024-01-14', users: 295 },
    { date: '2024-01-15', users: 312 },
    { date: '2024-01-16', users: 328 },
    { date: '2024-01-17', users: 345 },
    { date: '2024-01-18', users: 362 },
    { date: '2024-01-19', users: 378 },
    { date: '2024-01-20', users: 395 },
    { date: '2024-01-21', users: 412 },
    { date: '2024-01-22', users: 428 },
    { date: '2024-01-23', users: 445 },
    { date: '2024-01-24', users: 462 },
    { date: '2024-01-25', users: 478 },
    { date: '2024-01-26', users: 495 },
    { date: '2024-01-27', users: 512 },
    { date: '2024-01-28', users: 528 },
    { date: '2024-01-29', users: 545 },
    { date: '2024-01-30', users: 562 }
  ];

  private mockActivityData = [
    { date: '2024-01-01', logins: 89, actions: 234 },
    { date: '2024-01-02', logins: 95, actions: 245 },
    { date: '2024-01-03', logins: 102, actions: 267 },
    { date: '2024-01-04', logins: 108, actions: 289 },
    { date: '2024-01-05', logins: 115, actions: 301 },
    { date: '2024-01-06', logins: 121, actions: 315 },
    { date: '2024-01-07', logins: 128, actions: 328 },
    { date: '2024-01-08', logins: 134, actions: 342 },
    { date: '2024-01-09', logins: 141, actions: 356 },
    { date: '2024-01-10', logins: 147, actions: 369 },
    { date: '2024-01-11', logins: 154, actions: 382 },
    { date: '2024-01-12', logins: 160, actions: 395 },
    { date: '2024-01-13', logins: 167, actions: 408 },
    { date: '2024-01-14', logins: 173, actions: 421 },
    { date: '2024-01-15', logins: 180, actions: 434 },
    { date: '2024-01-16', logins: 186, actions: 447 },
    { date: '2024-01-17', logins: 193, actions: 460 },
    { date: '2024-01-18', logins: 199, actions: 473 },
    { date: '2024-01-19', logins: 206, actions: 486 },
    { date: '2024-01-20', logins: 212, actions: 499 },
    { date: '2024-01-21', logins: 219, actions: 512 },
    { date: '2024-01-22', logins: 225, actions: 525 },
    { date: '2024-01-23', logins: 232, actions: 538 },
    { date: '2024-01-24', logins: 238, actions: 551 },
    { date: '2024-01-25', logins: 245, actions: 564 },
    { date: '2024-01-26', logins: 251, actions: 577 },
    { date: '2024-01-27', logins: 258, actions: 590 },
    { date: '2024-01-28', logins: 264, actions: 603 },
    { date: '2024-01-29', logins: 271, actions: 616 },
    { date: '2024-01-30', logins: 277, actions: 629 }
  ];

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.api.getAdminStats().subscribe({
      next: stats => {
        this.stats = stats;
        this.api.getSystemDashboardStats().subscribe({
          next: systemStats => {
            this.systemStats = systemStats;
            this.processAnalyticsData();
            this.loading = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.systemStats = null;
            this.processAnalyticsData();
            this.loading = false;
            this.error = 'Impossible de charger certaines statistiques système.';
            this.cdr.markForCheck();
          }
        });
      },
      error: () => {
        // Use mock data if API fails
        this.stats = this.getMockStats();
        this.systemStats = this.getMockSystemStats();
        this.processAnalyticsData();
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private processAnalyticsData(): void {
    if (!this.stats) return;

    // Calculate KPIs
    this.calculateKPIs();

    // Generate charts
    this.generateCharts();
  }

  private calculateKPIs(): void {
    if (!this.stats) return;

    const totalUsers = this.stats.totalUser || 0;
    const activeUsers = this.stats.activeUser || 0;
    const newUsers24h = this.stats.last24hRegistrations || 0;

    // Growth Rate: (New Users / Total Users) * 100
    const growthRate = totalUsers > 0 ? (newUsers24h / totalUsers) * 100 : 0;

    // Approval Rate (mock calculation - would come from backend)
    const totalApprovals = Math.floor(totalUsers * 0.7); // Mock: 70% approval rate
    const totalRejections = Math.floor(totalUsers * 0.3); // Mock: 30% rejection rate
    const approvalRate = (totalApprovals / (totalApprovals + totalRejections)) * 100;

    // System Health (from stats or calculated)
    const systemHealth = this.stats.systemHealthIndex || 85.5;

    this.kpiCards = [
      {
        title: 'Total Users',
        value: totalUsers.toLocaleString(),
        change: 12.5,
        changeType: 'positive',
        icon: '👥',
        description: 'All registered users'
      },
      {
        title: 'Active Users',
        value: activeUsers.toLocaleString(),
        change: 8.2,
        changeType: 'positive',
        icon: '✅',
        description: 'Users active in last 30 days'
      },
      {
        title: 'New Users (24h)',
        value: newUsers24h.toLocaleString(),
        change: -2.1,
        changeType: 'negative',
        icon: '🆕',
        description: 'Registrations in last 24 hours'
      },
      {
        title: 'Growth Rate',
        value: `${growthRate.toFixed(1)}%`,
        change: 5.3,
        changeType: 'positive',
        icon: '📈',
        description: 'Monthly growth percentage'
      },
      {
        title: 'Approval Rate',
        value: `${approvalRate.toFixed(1)}%`,
        change: 1.8,
        changeType: 'positive',
        icon: '👍',
        description: 'Application approval rate'
      },
      {
        title: 'System Health',
        value: `${systemHealth.toFixed(1)}%`,
        change: 0.5,
        changeType: 'neutral',
        icon: '⚡',
        description: 'Overall system performance'
      }
    ];
  }

  private generateCharts(): void {
    // User Growth Chart
    const growthData = this.getFilteredUserGrowth();
    this.userGrowthChart = {
      labels: growthData.map(d => d.label),
      datasets: [{
        label: 'New Users',
        data: growthData.map(d => d.value),
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        borderColor: '#7c3aed',
        fill: true
      }]
    };

    // Role Distribution Chart
    this.roleDistributionChart = {
      labels: ['Admin', 'Agent', 'Client'],
      datasets: [{
        label: 'Users by Role',
        data: [
          Math.floor((this.stats?.totalUser || 0) * 0.05), // 5% admins
          Math.floor((this.stats?.totalUser || 0) * 0.15), // 15% agents
          Math.floor((this.stats?.totalUser || 0) * 0.80)  // 80% clients
        ],
        backgroundColor: [
          '#ef4444',
          '#f59e0b',
          '#10b981'
        ]
      }]
    };

    // Activity Chart
    const activityData = this.getFilteredActivityData();
    this.activityChart = {
      labels: activityData.map(d => d.label),
      datasets: [
        {
          label: 'User Logins',
          data: activityData.map(d => d.logins),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: '#3b82f6'
        },
        {
          label: 'Total Actions',
          data: activityData.map(d => d.actions),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: '#10b981'
        }
      ]
    };

    // Approval vs Rejection Chart
    const totalApprovals = Math.floor((this.stats?.totalUser || 0) * 0.7);
    const totalRejections = Math.floor((this.stats?.totalUser || 0) * 0.3);

    this.approvalChart = {
      labels: ['Approved', 'Rejected'],
      datasets: [{
        label: 'Applications',
        data: [totalApprovals, totalRejections],
        backgroundColor: [
          '#10b981',
          '#ef4444'
        ]
      }]
    };
  }

  private getFilteredUserGrowth(): { label: string; value: number }[] {
    const days = this.selectedRange === 'last7' ? 7 : this.selectedRange === 'last30' ? 30 : 90;
    return this.mockUserGrowth.slice(-days).map(item => ({
      label: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: item.users
    }));
  }

  private getFilteredActivityData(): { label: string; logins: number; actions: number }[] {
    const days = this.selectedRange === 'last7' ? 7 : this.selectedRange === 'last30' ? 30 : 90;
    return this.mockActivityData.slice(-days).map(item => ({
      label: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      logins: item.logins,
      actions: item.actions
    }));
  }

  private getMockStats(): AdminStats {
    return {
      totalUser: 562,
      activeUser: 423,
      last24hRegistrations: 23,
      systemHealthIndex: 85.5,
      totalClient: 449,
      totalAgent: 84,
      blockedUser: 12,
      suspendedUser: 5
    };
  }

  private getMockSystemStats(): SystemDashboardStats {
    return {
      totalTransactions: 15420,
      totalWallets: 892,
      totalCompletedTransactionVolume: 1250000,
      totalFraudulentTransactions: 23
    };
  }

  onRangeChange(range: 'last7' | 'last30' | 'last90'): void {
    this.selectedRange = range;
    this.processAnalyticsData();
    this.cdr.markForCheck();
  }

  // Chart helper methods
  getLinePoints(data: number[]): string {
    const maxValue = Math.max(...data);
    const points: string[] = [];

    data.forEach((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - (value / maxValue) * 100;
      points.push(`${x},${y}`);
    });

    return points.join(' ');
  }

  getPieSegments(chart: ChartData): any[] {
    const data = chart.datasets[0].data;
    const colors = chart.datasets[0].backgroundColor as string[];
    const total = data.reduce((sum, value) => sum + value, 0);
    const segments: any[] = [];
    let currentAngle = 0;

    data.forEach((value, index) => {
      const angle = (value / total) * 360;
      segments.push({
        color: colors[index],
        dasharray: `${angle} ${360 - angle}`,
        offset: currentAngle
      });
      currentAngle += angle;
    });

    return segments;
  }

  getPieLegend(chart: ChartData): any[] {
    const data = chart.datasets[0].data;
    const colors = chart.datasets[0].backgroundColor as string[];
    const labels = chart.labels;

    return labels.map((label, index) => ({
      label,
      value: data[index],
      color: colors[index]
    }));
  }

  getBarData(chart: ChartData): any[] {
    const data = chart.datasets[0].data;
    const colors = chart.datasets[0].backgroundColor as string[];
    const labels = chart.labels;
    const maxValue = Math.max(...data);

    return labels.map((label, index) => ({
      label,
      value: data[index],
      percentage: (data[index] / maxValue) * 100,
      color: colors[index]
    }));
  }

  getActivityBars(chart: ChartData): any[] {
    const loginsData = chart.datasets[0].data;
    const actionsData = chart.datasets[1].data;
    const labels = chart.labels;
    const maxLogins = Math.max(...loginsData);
    const maxActions = Math.max(...actionsData);

    return labels.map((label, index) => ({
      label,
      logins: loginsData[index],
      actions: actionsData[index],
      loginsPercent: (loginsData[index] / maxLogins) * 100,
      actionsPercent: (actionsData[index] / maxActions) * 100
    }));
  }

  getTransactionSuccessRate(): number {
    if (!this.systemStats?.totalTransactions || !this.systemStats?.totalFraudulentTransactions) {
      return 95.5; // Mock value
    }
    const total = this.systemStats.totalTransactions;
    const fraudulent = this.systemStats.totalFraudulentTransactions;
    return ((total - fraudulent) / total) * 100;
  }

  getFraudDetectionRate(): number {
    if (!this.systemStats?.totalFraudulentTransactions) {
      return 2.1; // Mock value
    }
    // Mock calculation: assume we detect 85% of fraudulent transactions
    return Math.min((this.systemStats.totalFraudulentTransactions / 100) * 85, 100);
  }
}
