import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DarkModeService } from '../../services/dark-mode.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);
  readonly darkModeService = inject(DarkModeService);

  expandedMenus: { [key: string]: boolean } = {
    user: false,
    credit: true,
    wallet: false,
    support: false,
    investissement: false
  };

  get currentUser() {
    const firstName = this.authService.getCurrentUserFirstName();
    const lastName = this.authService.getCurrentUserLastName();
    const role = this.authService.getCurrentUserRole();

    if (firstName && lastName) {
      return {
        name: `${firstName} ${lastName}`,
        role,
        initials: `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
      };
    }

    return { name: 'Utilisateur', role: role || 'Connecte', initials: 'U' };
  }

  get isClient(): boolean {
    return this.authService.isClient();
  }

  get isSupportStaff(): boolean {
    return this.authService.isSupportStaff();
  }

  get canViewUserMenu(): boolean {
    return this.authService.isAdmin();
  }

  get canViewWalletMenu(): boolean {
    return this.authService.hasAnyRole('ADMIN', 'AGENT', 'SUPER_ADMIN');
  }

  get canViewInvestmentMenu(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.cdr.markForCheck());
  }

  toggleMenu(menu: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.expandedMenus = { ...this.expandedMenus, [menu]: !this.expandedMenus[menu] };
    this.cdr.markForCheck();
  }

  toggleDarkMode(): void {
    this.darkModeService.toggleDarkMode();
  }

  logout(): void {
    this.authService.logout();
  }
}
