import { Injectable } from '@angular/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { ToastController } from '@ionic/angular/standalone';

/**
 * One place for user feedback: a toast message plus a haptic (vibration) pattern.
 * Haptics is a native Capacitor plugin; on the web (or devices without a vibration motor)
 * the call is simply ignored, so the app keeps working everywhere.
 */
@Injectable({ providedIn: 'root' })
export class FeedbackService {
  constructor(private toastCtrl: ToastController) {}

  private async safe(action: () => Promise<void>): Promise<void> {
    try {
      await action();
    } catch {
      /* haptics not supported here – ignore */
    }
  }

  /** Light tap, used when the user picks something (e.g. a category). */
  tap(): Promise<void> {
    return this.safe(() => Haptics.impact({ style: ImpactStyle.Light }));
  }

  /** Heavier tap, used before destructive actions. */
  warn(): Promise<void> {
    return this.safe(() => Haptics.notification({ type: NotificationType.Warning }));
  }

  async success(message: string): Promise<void> {
    void this.safe(() => Haptics.notification({ type: NotificationType.Success }));
    await this.show(message, 'success');
  }

  async error(message: string): Promise<void> {
    void this.safe(() => Haptics.notification({ type: NotificationType.Error }));
    await this.show(message, 'danger');
  }

  /**
   * "Deleted X  [Undo]" toast, shown above the bottom navigation. `onUndo` runs only when Undo is tapped.
   */
  async undo(message: string, onUndo: () => void | Promise<void>): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 5000,
      position: 'bottom',
      positionAnchor: document.querySelector<HTMLElement>('.ion-page:not(.ion-page-hidden) ion-footer') ?? undefined,
      cssClass: 'undo-toast',
      buttons: [
        {
          text: 'Undo',
          role: 'undo',
          handler: () => {
            void onUndo();
          },
        },
      ],
    });
    await toast.present();
  }

  private async show(message: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({ message, color, duration: 2000, position: 'top' });
    await toast.present();
  }
}
