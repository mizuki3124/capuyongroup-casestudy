import { Injectable, NgZone, signal } from '@angular/core';
import { Network } from '@capacitor/network';
import { Subject } from 'rxjs';

/**
 * Watches the device connection (Capacitor Network plugin; it falls back to the browser's online/offline
 * events on the web).
 *  - `online`        false while there is no connection  -> the "You're offline" banner
 *  - `backOnline`    true after the connection returns   -> the "Back online - Tap to refresh" banner
 *  - `refresh$`      emits when the user taps that banner, pages listen to it and reload their data
 */
@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  readonly online = signal(true);
  readonly backOnline = signal(false);
  readonly refresh$ = new Subject<void>();

  private hideTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(private zone: NgZone) {
    void this.start();
  }

  private async start(): Promise<void> {
    try {
      const status = await Network.getStatus();
      this.online.set(status.connected);
      await Network.addListener('networkStatusChange', (s) => this.zone.run(() => this.set(s.connected)));
    } catch {
      // plugin unavailable: use the browser events instead
      this.online.set(navigator.onLine);
      window.addEventListener('online', () => this.zone.run(() => this.set(true)));
      window.addEventListener('offline', () => this.zone.run(() => this.set(false)));
    }
  }

  private set(connected: boolean): void {
    const wasOnline = this.online();
    this.online.set(connected);

    if (!connected) {
      this.backOnline.set(false);
      clearTimeout(this.hideTimer);
    } else if (!wasOnline) {
      this.backOnline.set(true);
      clearTimeout(this.hideTimer);
      this.hideTimer = setTimeout(() => this.backOnline.set(false), 10000); // hide itself if ignored
    }
  }

  /** Called when the user taps "Tap to refresh". */
  refresh(): void {
    this.backOnline.set(false);
    clearTimeout(this.hideTimer);
    this.refresh$.next();
  }

  dismiss(): void {
    this.backOnline.set(false);
    clearTimeout(this.hideTimer);
  }
}
