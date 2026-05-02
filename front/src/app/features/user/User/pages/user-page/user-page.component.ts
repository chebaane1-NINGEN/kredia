import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize, Observable } from 'rxjs';
import { UserApi } from '../../data-access/user.api';
import { AuthService } from '../../../../../core/services/auth.service';
import { DashboardService } from '../../services/dashboard.service';
import { ClientProfile, ClientRiskScore, ClientEligibility, UserActivity, PasswordChangeRequest, ProfileUpdateRequest, SmartAlert, AIInsight, FinancialMetrics, ScoreHistoryPoint } from '../../models/user.model';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './user-page.component.html',
  styleUrl: './user-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserPageComponent implements OnInit {
  private readonly api = inject(UserApi);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly dashboardService = inject(DashboardService);

  // Role-based state
  userRole: string | null = null;
  isClient = false;
  isAdmin = false;
  isAgent = false;

  // Core client data
  profile: ClientProfile | null = null;
  riskScore: ClientRiskScore | null = null;
  eligibility: ClientEligibility | null = null;
  activities: UserActivity[] = [];
  
  // Advanced features
  alerts: SmartAlert[] = [];
  insights: AIInsight[] = [];
  metrics: FinancialMetrics | null = null;
  scoreHistory: ScoreHistoryPoint[] = [];
  quickInsights: string[] = [];
  
  // Loading states
  loadingProfile = false;
  loadingDashboard = false;
  loadingScore = false;
  loadingActivity = false;
  exportingPDF = false;
  
  error: string | null = null;
  success: string | null = null;
  profileError: string | null = null;
  riskScoreError: string | null = null;
  eligibilityError: string | null = null;
  activityError: string | null = null;
  alertsError: string | null = null;
  insightsError: string | null = null;
  metricsError: string | null = null;
  scoreHistoryError: string | null = null;
  currentUserId: number | null = null;

  // Pagination
  activityPage = 0;
  activityPageSize = 10;
  totalActivityPages = 0;

  // Modal states
  showEditProfileModal = false;
  showPasswordModal = false;
  showActivityFilterModal = false;
  showActivityDetail = false;
  selectedActivityDetail: UserActivity | null = null;

  // Forms  
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  filterForm!: FormGroup;

  // Activity filtering
  filteredActivities: UserActivity[] = [];
  activityFilterType = '';
  activityCategories = ['LOGIN', 'PROFILE_UPDATE', 'TRANSACTION', 'STATUS_CHANGE', 'VERIFICATION', 'ERROR'];

  // Sorting
  sortBy: 'date' | 'impact' = 'date';

  ngOnInit(): void {
    const userId = this.auth.getCurrentUserId();
    this.userRole = this.auth.getCurrentUserRole();
    
    this.isClient = this.userRole === 'CLIENT';
    this.isAdmin = this.userRole === 'ADMIN' || this.userRole === 'SUPER_ADMIN';
    this.isAgent = this.userRole === 'AGENT';

    if (userId) {
      this.currentUserId = userId;
      
      if (this.isClient) {
        this.loadClientDashboard();
        this.initializeForms();
      } else {
        this.error = null;
      }
    } else {
      this.error = 'Unable to load user information';
    }
  }

  private initializeForms(): void {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s\-()]{7,}$/)]],
      dateOfBirth: [''],
      address: [''],
      gender: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(8)]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    this.filterForm = this.fb.group({
      actionType: [''],
      sortBy: ['date']
    });
  }

  private passwordMatchValidator(group: FormGroup) {
    const password = group.get('newPassword')?.value;
    const confirm = group.get('confirmPassword')?.value;
    if (password && confirm && password !== confirm) {
      return { passwordMismatch: true };
    }
    return null;
  }

  private loadClientDashboard(): void {
    if (!this.currentUserId) return;
    
    this.loadingDashboard = true;
    this.loadingActivity = true;
    this.cdr.markForCheck();

    this.dashboardService.loadClientDashboard(this.currentUserId, this.activityPage, this.activityPageSize)
      .pipe(finalize(() => {
        this.loadingDashboard = false;
        this.loadingActivity = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (state) => {
          this.profile = state.profile;
          this.riskScore = state.riskScore;
          this.eligibility = state.eligibility;
          this.activities = state.activities;
          this.alerts = state.alerts;
          this.insights = state.insights;
          this.metrics = state.metrics;
          this.scoreHistory = state.scoreHistory;
          this.totalActivityPages = state.totalPages;
          this.activityPage = state.currentPage;
          
          // Generate quick insights
          if (this.riskScore) {
            this.quickInsights = this.dashboardService.generateQuickInsights(this.riskScore, this.activities);
          }

          // Populate profile form
          if (this.profile) {
            this.profileForm.patchValue({
              firstName: this.profile.firstName,
              lastName: this.profile.lastName,
              phoneNumber: this.profile.phoneNumber ?? this.profile.phone,
              dateOfBirth: this.profile.dateOfBirth,
              address: this.profile.address,
              gender: this.profile.gender
            });
          }

          this.profileError = state.profileError;
          this.riskScoreError = state.riskScoreError;
          this.eligibilityError = state.eligibilityError;
          this.activityError = state.activityError;
          this.alertsError = state.alertsError;
          this.insightsError = state.insightsError;
          this.metricsError = state.metricsError;
          this.scoreHistoryError = state.scoreHistoryError;
          this.error = state.error;
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          this.error = 'Failed to load dashboard: ' + (err.error?.message || err.statusText || 'Unknown error');
          this.cdr.markForCheck();
        }
      });
  }

  // Modal operations
  openEditProfileModal(): void {
    this.showEditProfileModal = true;
    this.cdr.markForCheck();
  }

  closeEditProfileModal(): void {
    this.showEditProfileModal = false;
    this.cdr.markForCheck();
  }

  openPasswordModal(): void {
    this.showPasswordModal = true;
    this.passwordForm.reset();
    this.cdr.markForCheck();
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
    this.cdr.markForCheck();
  }

  openActivityFilterModal(): void {
    this.showActivityFilterModal = true;
    this.cdr.markForCheck();
  }

  closeActivityFilterModal(): void {
    this.showActivityFilterModal = false;
    this.cdr.markForCheck();
  }

  showActivityDetailModal(activity: UserActivity): void {
    this.selectedActivityDetail = activity;
    this.showActivityDetail = true;
    this.cdr.markForCheck();
  }

  closeActivityDetailModal(): void {
    this.showActivityDetail = false;
    this.selectedActivityDetail = null;
    this.cdr.markForCheck();
  }

  // Profile management
  submitProfileUpdate(): void {
    if (!this.currentUserId || !this.profileForm.valid) {
      this.error = 'Please correct the form errors';
      this.cdr.markForCheck();
      return;
    }

    this.loadingProfile = true;
    this.error = null;
    this.cdr.markForCheck();

    const update: ProfileUpdateRequest = {
      firstName: this.profileForm.get('firstName')?.value,
      lastName: this.profileForm.get('lastName')?.value,
      phoneNumber: this.profileForm.get('phoneNumber')?.value,
      dateOfBirth: this.profileForm.get('dateOfBirth')?.value,
      address: this.profileForm.get('address')?.value,
      gender: this.profileForm.get('gender')?.value
    };

    this.api.updateClientProfile(this.currentUserId, update)
      .pipe(finalize(() => {
        this.loadingProfile = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (updated) => {
          this.profile = updated;
          this.success = 'Profile updated successfully';
          this.closeEditProfileModal();
          setTimeout(() => { this.success = null; this.cdr.markForCheck(); }, 3000);
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          this.error = 'Failed to update profile: ' + (err.error?.message || err.statusText || 'Unknown error');
          this.cdr.markForCheck();
        }
      });
  }

  submitPasswordChange(): void {
    if (!this.currentUserId || !this.passwordForm.valid) {
      this.error = 'Please correct the form errors';
      this.cdr.markForCheck();
      return;
    }

    this.loadingProfile = true;
    this.error = null;
    this.cdr.markForCheck();

    const request: PasswordChangeRequest = {
      currentPassword: this.passwordForm.get('currentPassword')?.value,
      newPassword: this.passwordForm.get('newPassword')?.value,
      confirmPassword: this.passwordForm.get('confirmPassword')?.value
    };

    this.api.changePassword(this.currentUserId, request)
      .pipe(finalize(() => {
        this.loadingProfile = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.success = 'Password changed successfully';
          this.closePasswordModal();
          setTimeout(() => { this.success = null; this.cdr.markForCheck(); }, 3000);
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          this.error = 'Failed to change password: ' + (err.error?.message || err.statusText || 'Unknown error');
          this.cdr.markForCheck();
        }
      });
  }

  // Activity filtering and sorting
  filterActivities(): void {
    let filtered = this.activities ?? [];
    
    const filterType = this.filterForm?.get('actionType')?.value;
    if (filterType) {
      filtered = filtered.filter(a => a.actionType?.toUpperCase().includes(filterType.toUpperCase()));
    }

    this.sortBy = this.filterForm?.get('sortBy')?.value || 'date';
    if (this.sortBy === 'impact') {
      filtered = filtered.sort((a, b) => (b.scoreImpact || 0) - (a.scoreImpact || 0));
    } else {
      filtered = filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    this.filteredActivities = filtered;
    this.cdr.markForCheck();
  }

  // Pagination
  nextActivityPage(): void {
    if (this.activityPage < this.totalActivityPages - 1) {
      this.activityPage++;
      this.loadClientDashboard();
    }
  }

  previousActivityPage(): void {
    if (this.activityPage > 0) {
      this.activityPage--;
      this.loadClientDashboard();
    }
  }

  // PDF Export
  exportProfilePDF(): void {
    if (!this.currentUserId) return;

    this.exportingPDF = true;
    this.cdr.markForCheck();

    // Try backend export first
    this.api.exportProfileReport(this.currentUserId, 'pdf')
      .pipe(finalize(() => {
        this.exportingPDF = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `profile_report_${new Date().toISOString().split('T')[0]}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: () => {
          // Fallback to client-side PDF generation
          this.generateClientSidePDF();
        }
      });
  }

  private generateClientSidePDF(): void {
    const element = document.getElementById('profile-content');
    if (!element) return;

    html2canvas(element, { scale: 2, useCORS: true })
      .then((canvas) => {
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const img = canvas.toDataURL('image/png');
        const width = pdf.internal.pageSize.getWidth();
        const height = (canvas.height * width) / canvas.width;

        pdf.addImage(img, 'PNG', 0, 0, width, height);
        pdf.save(`profile_report_${new Date().toISOString().split('T')[0]}.pdf`);

        this.success = 'Profile report exported successfully';
        setTimeout(() => { this.success = null; this.cdr.markForCheck(); }, 3000);
      })
      .catch((err) => {
        console.error('PDF generation failed:', err);
        this.error = 'Failed to export profile report';
      })
      .finally(() => {
        this.cdr.markForCheck();
      });
  }

  // Helper methods for display
  getStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      'ACTIVE': '#10b981',
      'INACTIVE': '#d1d5db',
      'SUSPENDED': '#f59e0b',
      'BLOCKED': '#ef4444',
      'PENDING_VERIFICATION': '#3b82f6'
    };
    return statusColors[status] || '#d1d5db';
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'ACTIVE': '✓',
      'INACTIVE': '○',
      'SUSPENDED': '⚠',
      'BLOCKED': '✗',
      'PENDING_VERIFICATION': '⧗'
    };
    return icons[status] || '○';
  }

  getEligibilityIcon(): string {
    return this.eligibility?.eligible ? '✓' : '✗';
  }

  getEligibilityBadge(): string {
    if (!this.eligibility) return 'UNKNOWN';
    return this.eligibility.eligible ? 'ELIGIBLE' : (this.eligibility.currentScore >= 40 ? 'AT_RISK' : 'BLOCKED');
  }

  getScorePercentage(): number {
    return this.riskScore ? (this.riskScore.riskScore / 100) * 100 : 0;
  }

  getScoreColor(): string {
    if (!this.riskScore) return '#d1d5db';
    const score = this.riskScore.riskScore;
    if (score >= 75) return '#10b981'; // Good
    if (score >= 50) return '#f59e0b'; // Moderate
    return '#ef4444'; // Poor
  }

  getScoreLabel(): string {
    if (!this.riskScore) return 'Unknown';
    const score = this.riskScore.riskScore;
    if (score >= 80) return 'Excellent';
    if (score >= 75) return 'Very Good';
    if (score >= 60) return 'Good';
    if (score >= 50) return 'Fair';
    if (score >= 40) return 'Poor';
    return 'Very Poor';
  }

  getActivityIcon(actionType: string): string {
    const icons: Record<string, string> = {
      'LOGIN': '🔓',
      'PROFILE_UPDATE': '✏️',
      'TRANSACTION': '💳',
      'STATUS_CHANGE': '↔️',
      'VERIFICATION': '✓',
      'ERROR': '⚠️'
    };
    return icons[actionType] || '○';
  }

  getActivitySeverityColor(severity?: string): string {
    const colors: Record<string, string> = {
      'LOW': '#10b981',
      'MEDIUM': '#f59e0b',
      'HIGH': '#ef4444'
    };
    return colors[severity || 'LOW'] || '#6b7280';
  }

  getAccountHealth(): number {
    return this.metrics ? this.dashboardService.calculateAccountHealth(this.metrics) : 50;
  }

  getRiskLevelColor(level: string): string {
    const colors: Record<string, string> = {
      'LOW': '#10b981',
      'MEDIUM': '#f59e0b',
      'HIGH': '#ef4444',
      'CRITICAL': '#7c2d12'
    };
    return colors[level] || '#6b7280';
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  formatTime(dateString?: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString();
  }

  formatDateTime(dateString?: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  }

}

