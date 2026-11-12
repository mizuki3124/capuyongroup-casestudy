import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';

/** Full-screen front page shown every time the app opens, then it moves on to Sign in (or Records if already signed in). */
@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  imports: [IonContent, IonSpinner],
})
export class SplashPage {
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(private router: Router) {}

  ionViewDidEnter() {
    // The home route's guard forwards signed-in users straight to Records.
    this.timer = setTimeout(() => void this.router.navigate(['/home'], { replaceUrl: true }), 1700);
  }

  ionViewWillLeave() {
    clearTimeout(this.timer);
  }
}
