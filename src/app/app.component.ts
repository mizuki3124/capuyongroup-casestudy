import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add, addCircleOutline, addOutline, bus, busOutline, calendarOutline, cardOutline, cartOutline,
  cashOutline, chevronBack, chevronForward, close, cloudOfflineOutline, compassOutline, createOutline,
  documentTextOutline, gameControllerOutline, helpOutline, imageOutline, imagesOutline, lockClosedOutline,
  mailOutline, medkitOutline, personCircleOutline, personOutline, restaurantOutline, schoolOutline,
  searchOutline, trashOutline, walletOutline,
} from 'ionicons/icons';
import { ThemeService } from './core/theme.service';
import { ConnectionBannerComponent } from './shared/connection-banner/connection-banner.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonApp, IonRouterOutlet, ConnectionBannerComponent],
})
export class AppComponent {
  constructor(theme: ThemeService) {
    theme.init(); // apply the saved (or the phone's) light / dark choice before anything is drawn

    // Standalone Ionic needs every icon to be registered once.
    addIcons({
      add, addCircleOutline, addOutline, bus, busOutline, calendarOutline, cardOutline, cartOutline,
      cashOutline, chevronBack, chevronForward, close, cloudOfflineOutline, compassOutline, createOutline,
      documentTextOutline, gameControllerOutline, helpOutline, imageOutline, imagesOutline, lockClosedOutline,
      mailOutline, medkitOutline, personCircleOutline, personOutline, restaurantOutline, schoolOutline,
      searchOutline, trashOutline, walletOutline,
    });
  }
}
