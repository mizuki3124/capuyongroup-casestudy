import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';

const THEME_KEY = 'expensesave:dark';

/**
 * Dark mode. The choice is remembered on the device; until the user flips the switch the app follows
 * the phone's own light/dark setting.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private dark = false;

  constructor(private storage: StorageService) {}

  /** Call once at startup. */
  init(): void {
    const saved = this.storage.get<boolean | null>(THEME_KEY, null);
    const system = typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
    this.apply(saved ?? system);
  }

  isDark(): boolean {
    return this.dark;
  }

  set(dark: boolean): void {
    this.storage.set(THEME_KEY, dark);
    this.apply(dark);
  }

  private apply(dark: boolean): void {
    this.dark = dark;
    // "ion-palette-dark" switches Ionic's own components (alerts, popovers...); our colours follow the same class.
    document.documentElement.classList.toggle('ion-palette-dark', dark);
  }
}
