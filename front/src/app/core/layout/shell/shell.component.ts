import { ChangeDetectionStrategy, Component, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, NavbarComponent, FooterComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShellComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  isHomePage = false;

  expandedMenus: { [key: string]: boolean } = {
    user: false,
    credit: true,
    wallet: false,
    support: false,
    investissement: false
  };

  ngOnInit(): void {
    // Initial check
    this.updateIsHomePage(this.router.url);

    // Subscribe to route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateIsHomePage(event.urlAfterRedirects || event.url);
      this.cdr.markForCheck();
    });
  }

  private updateIsHomePage(url: string): void {
    // Check if the current URL is the home page
    const path = url.split('?')[0];
    this.isHomePage = path === '/' || path === '/home';
  }

  toggleMenu(menu: string, event: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Create new object for OnPush detection
    this.expandedMenus = {
      ...this.expandedMenus,
      [menu]: !this.expandedMenus[menu]
    };
    
    this.cdr.markForCheck();
  }
}
