import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DarkModeService } from '../../services/dark-mode.service';
import { AuthService } from '../../services/auth.service';
import { CreditApi } from '../../../features/credit/Credit/data-access/credit.api';
import { KycLoanApi } from '../../../features/credit/KycLoan/data-access/kyc-loan.api';
import { EcheanceApi } from '../../../features/credit/Echeance/data-access/echeance.api';
import { forkJoin, Subscription, interval, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface NotifItem {
  type: 'CREDIT' | 'KYC' | 'PAYMENT';
  id: number;
  relatedId?: number;
  status: string;
  date: Date;
  title: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent implements OnInit, OnDestroy {
  darkModeService = inject(DarkModeService);
  auth = inject(AuthService);
  creditApi = inject(CreditApi);
  kycApi = inject(KycLoanApi);
  echeanceApi = inject(EcheanceApi);
  router = inject(Router);
  cdr = inject(ChangeDetectorRef);

  recentUpdates: NotifItem[] = [];
  hasUnread = false;
  showDropdown = false;
  private sub: Subscription | null = null;

  ngOnInit() {
    this.fetchUpdates();
    this.sub = interval(30000).subscribe(() => this.fetchUpdates());
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }

  toggleDarkMode() {
    this.darkModeService.toggleDarkMode();
  }

  fetchUpdates() {
    const userId = this.auth.getCurrentUserId();
    if (!userId) return;

    if (this.auth.isClient()) {
      forkJoin({
        credits: this.creditApi.findDemandesByUserId(userId).pipe(catchError(() => of([]))),
        kycs: this.kycApi.getByUserId(userId).pipe(catchError(() => of([])))
      }).subscribe(({ credits, kycs }) => {
        const updates: NotifItem[] = [];

        credits.forEach(c => {
          if (c.status === 'APPROVED' || c.status === 'REJECTED') {
            updates.push({
              type: 'CREDIT',
              id: c.creditId || 0,
              status: c.status,
              date: c.createdAt ? new Date(c.createdAt) : new Date(),
              title: `Credit Application ${c.status === 'APPROVED' ? 'Approved' : 'Rejected'}`
            });
          }
        });

        kycs.forEach(k => {
          if (k.verifiedStatus === 'APPROVED' || k.verifiedStatus === 'REJECTED') {
            updates.push({
              type: 'KYC',
              id: k.kycLoanId || 0,
              relatedId: k.creditId || k.demandeId || 0,
              status: k.verifiedStatus,
              date: k.submittedAt ? new Date(k.submittedAt) : new Date(),
              title: `KYC Document ${k.verifiedStatus === 'APPROVED' ? 'Approved' : 'Rejected'}`
            });
          }
        });

        updates.sort((a, b) => b.date.getTime() - a.date.getTime());
        this.recentUpdates = updates.slice(0, 5);
        this.checkUnread();
        this.cdr.markForCheck();
      });
    } else {
      // Admin / Agent Logic
      forkJoin({
        credits: this.creditApi.getPendingDemandes().pipe(catchError(() => of([]))),
        kycs: this.kycApi.getAll().pipe(catchError(() => of([]))),
        echeances: this.echeanceApi.getAll().pipe(catchError(() => of([])))
      }).subscribe(({ credits, kycs, echeances }) => {
        const updates: NotifItem[] = [];

        credits.forEach(c => {
          if (c.status === 'PENDING') {
            updates.push({
              type: 'CREDIT',
              id: c.creditId || 0,
              status: c.status,
              date: c.createdAt ? new Date(c.createdAt) : new Date(),
              title: `New Credit Application to Review`
            });
          }
        });

        kycs.forEach(k => {
          if (k.verifiedStatus === 'PENDING') {
            updates.push({
              type: 'KYC',
              id: k.kycLoanId || 0,
              relatedId: k.creditId || k.demandeId || 0,
              status: k.verifiedStatus,
              date: k.submittedAt ? new Date(k.submittedAt) : new Date(),
              title: `New KYC Document Submitted`
            });
          }
        });

        echeances.forEach(e => {
          if (e.echeance.status === 'PAID' || e.echeance.status === 'PARTIALLY_PAID') {
            updates.push({
              type: 'PAYMENT',
              id: e.echeance.echeanceId || 0,
              status: e.echeance.status,
              date: e.echeance.paidAt ? new Date(e.echeance.paidAt) : new Date(),
              title: `Installment Payment Received`
            });
          }
        });

        updates.sort((a, b) => b.date.getTime() - a.date.getTime());
        this.recentUpdates = updates.slice(0, 5);
        this.checkUnread();
        this.cdr.markForCheck();
      });
    }
  }

  checkUnread() {
    const lastSeen = Number(localStorage.getItem('lastNotifSeen')) || 0;
    this.hasUnread = this.recentUpdates.some(u => u.date.getTime() > lastSeen);
  }

  toggleNotifications() {
    this.showDropdown = !this.showDropdown;
    if (this.showDropdown && this.recentUpdates.length > 0) {
      localStorage.setItem('lastNotifSeen', Date.now().toString());
      this.hasUnread = false;
      this.cdr.markForCheck();
    }
  }

  goToTarget(item: NotifItem) {
    this.showDropdown = false;
    if (item.type === 'CREDIT') {
      this.router.navigate(['/credit/list'], { queryParams: { demandeId: item.id } });
    } else if (item.type === 'KYC') {
      if (!this.auth.isClient() && item.status === 'PENDING') {
        // Admin: go to list page and open modal
        this.router.navigate(['/credit/list'], { queryParams: { openKycDemandeId: item.relatedId, filterKycLoanId: item.id } });
      } else {
        // Client or Admin viewing specific doc: go to KYC page
        this.router.navigate(['/credit/kyc'], { queryParams: { kycLoanId: item.id } });
      }
    } else {
      this.router.navigate(['/credit/echeances'], { queryParams: { echeanceId: item.id } });
    }
  }
}
