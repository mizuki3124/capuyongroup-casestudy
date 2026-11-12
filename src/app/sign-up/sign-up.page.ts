import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonInput, IonSpinner } from '@ionic/angular/standalone';
import { AuthService } from '../core/auth.service';
import { FeedbackService } from '../core/feedback.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.page.html',
  styleUrls: ['./sign-up.page.scss'],
  imports: [FormsModule, RouterLink, IonContent, IonInput, IonButton, IonIcon, IonSpinner],
})
export class SignUpPage {
  name = '';
  email = '';
  password = '';
  confirm = '';
  busy = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private feedback: FeedbackService,
  ) {}

  ionViewWillEnter() {
    this.name = this.email = this.password = this.confirm = '';
  }

  async signUp() {
    if (this.busy) return;
    this.busy = true;
    try {
      const result = await this.auth.register(this.name, this.email, this.password, this.confirm);
      if (result.ok) {
        await this.feedback.success('Account created! Please sign in.');
        await this.router.navigate(['/home']);
      } else {
        await this.feedback.error(result.error);
      }
    } finally {
      this.busy = false;
    }
  }
}
