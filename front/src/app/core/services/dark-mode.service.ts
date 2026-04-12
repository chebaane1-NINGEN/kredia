import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DarkModeService {
  isDarkMode = signal(this.getInitialMode());

  private getInitialMode(): boolean {
    if (typeof window === 'undefined') return false;
    
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return JSON.parse(saved);
    
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  toggleDarkMode() {
    const newMode = !this.isDarkMode();
    this.isDarkMode.set(newMode);
    localStorage.setItem('darkMode', JSON.stringify(newMode));
    this.applyMode(newMode);
  }

  private applyMode(isDark: boolean) {
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
