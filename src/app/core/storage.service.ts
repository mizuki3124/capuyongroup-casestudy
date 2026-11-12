import { Injectable } from '@angular/core';

/**
 * Thin wrapper around localStorage so the rest of the app never touches it directly.
 * Swapping this class for Capacitor Preferences/SQLite later would not affect any page.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback; // corrupted JSON or storage unavailable
    }
  }

  set<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }
}
