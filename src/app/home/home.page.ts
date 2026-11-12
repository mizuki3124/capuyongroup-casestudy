import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonInput, IonSpinner } from '@ionic/angular/standalone';
import { AuthService } from '../core/auth.service';
import { FeedbackService } from '../core/feedback.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [FormsModule, RouterLink, IonContent, IonInput, IonButton, IonIcon, IonSpinner],
})
export class HomePage {
  in_email = '';
  in_password = '';
  busy = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private feedback: FeedbackService,
  ) {}

  ionViewWillEnter() {
    this.in_email = '';
    this.in_password = '';
  }

  async signin() {
    if (this.busy) return;
    this.busy = true;
    try {
      const result = await this.auth.login(this.in_email, this.in_password);
      if (result.ok) {
        await this.router.navigate(['/records']);
      } else {
        await this.feedback.error(result.error);
      }
    } finally {
      this.busy = false;
    }
  }
}
