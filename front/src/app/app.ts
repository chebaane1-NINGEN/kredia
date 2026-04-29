import { Component, inject, effect } from '@angular/core';
import { ShellComponent } from './core/layout/shell/shell.component';
import { DarkModeService } from './core/services/dark-mode.service';
import { NotificationComponent } from './core/components/notification/notification.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ShellComponent, NotificationComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  darkModeService = inject(DarkModeService);

  constructor() {
    // Initialize dark mode on app startup
    this.darkModeService.init();

    // Apply mode change when signal changes
    effect(() => {
      this.darkModeService.isDarkMode();
    });
  }
}
