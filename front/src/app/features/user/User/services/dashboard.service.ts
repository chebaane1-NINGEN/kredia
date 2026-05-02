import { Injectable } from '@angular/core';
import { Observable, combineLatest, of } from 'rxjs';
import { map, catchError, startWith } from 'rxjs/operators';
import { UserApi } from '../data-access/user.api';
import { 
  ClientProfile, 
  ClientRiskScore, 
  ClientEligibility, 
  UserActivity, 
  ActivityPage, 
  SmartAlert, 
  AIInsight, 
  FinancialMetrics,
  ScoreHistoryPoint 
} from '../models/user.model';

export interface DashboardState {
  profile: ClientProfile | null;
  riskScore: ClientRiskScore | null;
  eligibility: ClientEligibility | null;
  activities: UserActivity[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  alerts: SmartAlert[];
  insights: AIInsight[];
  metrics: FinancialMetrics | null;
  scoreHistory: ScoreHistoryPoint[];
  loading: boolean;
  error: string | null;
  profileError: string | null;
  riskScoreError: string | null;
  eligibilityError: string | null;
  activityError: string | null;
  alertsError: string | null;
  insightsError: string | null;
  metricsError: string | null;
  scoreHistoryError: string | null;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private readonly api: UserApi) {}

  // Load all dashboard data for a client
  loadClientDashboard(clientId: number, page = 0, pageSize = 20): Observable<DashboardState> {
    return combineLatest([
      this.safeCall(this.api.getClientProfile(clientId), null, 'Profile'),
      this.safeCall(this.api.getClientRiskScore(clientId), null, 'Risk score'),
      this.safeCall(this.api.getClientEligibility(clientId), null, 'Eligibility'),
      this.safeCall(this.api.getClientActivity(clientId, page, pageSize), {
        activities: [],
        totalPages: 0,
        totalElements: 0,
        currentPage: 0
      }, 'Activity'),
      this.safeCall(this.api.getSmartAlerts(clientId), [], 'Alerts'),
      this.safeCall(this.api.getAIInsights(clientId), [], 'Insights'),
      this.safeCall(this.api.getFinancialMetrics(clientId), null, 'Financial metrics'),
      this.safeCall(this.api.getScoreHistory(clientId, 90), [], 'Score history')
    ]).pipe(
      map(([profile, score, eligibility, activities, alerts, insights, metrics, history]) => ({
        profile: profile.data,
        riskScore: score.data,
        eligibility: eligibility.data,
        activities: activities.data.activities,
        totalPages: activities.data.totalPages,
        totalElements: activities.data.totalElements,
        currentPage: activities.data.currentPage,
        alerts: alerts.data,
        insights: insights.data,
        metrics: metrics.data,
        scoreHistory: history.data,
        loading: false,
        error: null,
        profileError: profile.error,
        riskScoreError: score.error,
        eligibilityError: eligibility.error,
        activityError: activities.error,
        alertsError: alerts.error,
        insightsError: insights.error,
        metricsError: metrics.error,
        scoreHistoryError: history.error
      })),
      catchError(error => {
        console.error('Dashboard load error:', error);
        return of({
          profile: null,
          riskScore: null,
          eligibility: null,
          activities: [],
          totalPages: 0,
          totalElements: 0,
          currentPage: 0,
          alerts: [],
          insights: [],
          metrics: null,
          scoreHistory: [],
          loading: false,
          error: 'Failed to load dashboard data',
          profileError: 'Failed to load profile data',
          riskScoreError: 'Failed to load risk score data',
          eligibilityError: 'Failed to load eligibility data',
          activityError: 'Failed to load activity data',
          alertsError: 'Failed to load alerts',
          insightsError: 'Failed to load insights',
          metricsError: 'Failed to load financial metrics',
          scoreHistoryError: 'Failed to load score history'
        });
      }),
      startWith({
        profile: null,
        riskScore: null,
        eligibility: null,
        activities: [],
        totalPages: 0,
        totalElements: 0,
        currentPage: 0,
        alerts: [],
        insights: [],
        metrics: null,
        scoreHistory: [],
        loading: true,
        error: null,
        profileError: null,
        riskScoreError: null,
        eligibilityError: null,
        activityError: null,
        alertsError: null,
        insightsError: null,
        metricsError: null,
        scoreHistoryError: null
      })
    );
  }

  private safeCall<T>(observable: Observable<T>, fallback: T, section: string): Observable<{ data: T; error: string | null }> {
    return observable.pipe(
      map(data => ({ data, error: null })),
      catchError(err => of({ data: fallback, error: this.formatApiError(err, section) }))
    );
  }

  private formatApiError(error: any, section: string): string {
    const message = error?.error?.message || error?.message || error?.statusText || 'Service unavailable';
    return `${section} is unavailable: ${message}`;
  }

  // Calculate account health score (0-100)
  calculateAccountHealth(metrics: FinancialMetrics | null): number {
    if (!metrics) return 50;
    
    const health = Math.min(100, Math.max(0,
      (metrics.accountAgeMonths > 0 ? Math.min(20, Math.floor(metrics.accountAgeMonths / 3)) : 0) +
      (100 - metrics.daysSinceLastActivity > 0 ? 30 : 15) +
      (metrics.totalActivityCount * 2) +
      (metrics.riskLevel === 'LOW' ? 35 : metrics.riskLevel === 'MEDIUM' ? 20 : metrics.riskLevel === 'HIGH' ? 10 : 0)
    ));
    
    return Math.round(health);
  }

  // Generate insights based on score and activities
  generateQuickInsights(score: ClientRiskScore | null, activities: UserActivity[]): string[] {
    const insights: string[] = [];

    if (!score) return insights;

    // Score-based insights
    if (score.riskScore >= 80) {
      insights.push('🌟 Excellent Score! You maintain a stellar financial profile.');
    } else if (score.riskScore >= 60) {
      insights.push('📈 Good Score! Keep up the positive activity to improve further.');
    } else if (score.riskScore >= 40) {
      insights.push('⚠️  Score Improvement Needed - Increase your account activity.');
    } else {
      insights.push('🔴 Low Score - Contact support for guidance on score improvement.');
    }

    // Activity-based insights
    const recentActivities = activities.slice(0, 5);
    if (recentActivities.length > 0) {
      insights.push(`✓ Recent activity recorded: ${recentActivities.length} action(s) in the past period.`);
    }

    // Seniority insights
    if (score.seniorityBonus > 0) {
      insights.push('⭐ Your account seniority provides a score bonus! Keep your account active.');
    }

    return insights;
  }

  // Determine eligibility reasons
  getEligibilityReasons(eligibility: ClientEligibility | null): { title: string; items: string[] } {
    if (!eligibility) {
      return { title: 'Unable to determine eligibility', items: [] };
    }

    const reasons = {
      title: eligibility.eligible ? '✓ Eligibility Criteria Met' : '✗ Eligibility Criteria Not Met',
      items: [
        eligibility.isActive 
          ? '✓ Account Status: ACTIVE' 
          : '✗ Account Status: NOT ACTIVE',
        eligibility.currentScore >= eligibility.scoreThreshold
          ? `✓ Risk Score: ${eligibility.currentScore}/${eligibility.scoreThreshold} (Threshold Met)`
          : `✗ Risk Score: ${eligibility.currentScore}/${eligibility.scoreThreshold} (Need ${eligibility.scoreThreshold - eligibility.currentScore} more points)`,
        eligibility.eligible
          ? '✓ Approved for credit products'
          : '○ Not yet approved - improve your profile'
      ]
    };

    return reasons;
  }
}
