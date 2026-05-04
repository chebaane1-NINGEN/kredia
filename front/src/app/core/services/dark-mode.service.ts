import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DarkModeService {
  isDarkMode = signal(this.getInitialMode());

  private getInitialMode(): boolean {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;

    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      try {
        return JSON.parse(saved);
      } catch {
        return false;
      }
    }

    if (typeof window.matchMedia !== 'function') return false;

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  toggleDarkMode() {
    const newMode = !this.isDarkMode();
    this.isDarkMode.set(newMode);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('darkMode', JSON.stringify(newMode));
    }
    this.applyMode(newMode);
  }

  private applyMode(isDark: boolean) {
    if (typeof document === 'undefined') return;

    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark-mode');
    } else {
      html.classList.remove('dark-mode');
    }
  }

  init() {
    this.applyMode(this.isDarkMode());
  }
}
