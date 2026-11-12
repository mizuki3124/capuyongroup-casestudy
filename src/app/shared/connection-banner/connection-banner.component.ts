import { Component } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { ConnectivityService } from '../../core/connectivity.service';

/**
 * Banner pinned to the top of the app:
 *  - red "You're offline" while there is no connection
 *  - green "Back online - Tap to refresh" once the connection returns (tapping reloads the current page's data)
 */
@Component({
  selector: 'app-connection-banner',
  imports: [IonIcon],
  template: `
    @if (!net.online()) {
      <div class="banner offline" role="status" aria-live="polite">
        <ion-icon name="cloud-offline-outline"></ion-icon>
        <span class="msg"><b>You're offline</b><small>Changes can't be saved right now.</small></span>
      </div>
    } @else if (net.backOnline()) {
      <button type="button" class="banner online" (click)="net.refresh()">
        <b>Back online</b>
        <span class="cta">Tap to refresh</span>
      </button>
    }
  `,
  styles: [`
    :host {
      position: fixed;
      top: calc(var(--ion-safe-area-top, 0px) + 8px);
      left: 12px;
      right: 12px;
      z-index: 20000;
      pointer-events: none;
    }
    .banner {
      pointer-events: auto;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 12px 16px;
      border: 0;
      border-radius: 16px;
      color: #fff;
      font: inherit;
      font-size: 14px;
      text-align: left;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.22);
      animation: drop 0.25s ease-out;
    }
    .online { background: #0f4d38; cursor: pointer; }
    .online .cta { color: #e3ae2f; font-weight: 700; text-decoration: underline; }
    .offline { background: #7a2b25; justify-content: flex-start; }
    .offline ion-icon { font-size: 22px; flex-shrink: 0; }
    .msg { display: flex; flex-direction: column; }
    .msg small { opacity: 0.85; font-size: 12px; }
    @keyframes drop { from { transform: translateY(-16px); opacity: 0; } to { transform: none; opacity: 1; } }
  `],
})
export class ConnectionBannerComponent {
  constructor(public net: ConnectivityService) {}
}
