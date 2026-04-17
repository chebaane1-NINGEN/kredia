import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
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
  private readonly authService = inject(AuthService);
  readonly darkModeService = inject(DarkModeService);

  expandedMenus: { [key: string]: boolean } = {
    user: false,
    credit: true,
    wallet: false,
    support: false,
    investissement: false
  };

  currentUser = { name: 'Admin System', role: 'Admin', initials: 'AS' };

  ngOnInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => this.cdr.markForCheck());
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
