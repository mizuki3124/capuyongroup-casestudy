import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AlertController, IonButton, IonContent, IonHeader, IonIcon, IonInput, IonModal, IonSpinner, IonToggle, IonToolbar,
} from '@ionic/angular/standalone';
import { AuthService } from '../core/auth.service';
import { FeedbackService } from '../core/feedback.service';
import { ThemeService } from '../core/theme.service';
import { BottomNavComponent } from '../shared/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-account',
  templateUrl: './account.page.html',
  styleUrls: ['./account.page.scss'],
  imports: [
    FormsModule, BottomNavComponent,
    IonHeader, IonToolbar, IonContent, IonButton, IonIcon, IonInput, IonModal, IonSpinner, IonToggle,
  ],
})
export class AccountPage {
  name = '';
  email = '';
  dark = false;

  // Edit profile sheet
  profileOpen = false;
  editName = '';
  editEmail = '';
  savingProfile = false;

  // Change password sheet
  passwordOpen = false;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  savingPassword = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private alertCtrl: AlertController,
    private feedback: FeedbackService,
    private theme: ThemeService,
  ) {}

  /** Up to two capital letters from the user's name, shown in the avatar. */
  get initials(): string {
    const parts = this.name.trim().split(/\s+/).filter(Boolean);
    const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? '').slice(0, 2);
    return letters.toUpperCase() || '?';
  }

  ionViewWillEnter() {
    const user = this.auth.currentUser();
    this.name = user?.name ?? '';
    this.email = user?.email ?? '';
    this.dark = this.theme.isDark();
  }

  // ---- Dark mode ----
  onDarkChange(on: boolean) {
    this.dark = on;
    this.theme.set(on);
  }

  // ---- Edit profile ----
  openProfile() {
    this.editName = this.name;
    this.editEmail = this.email;
    this.profileOpen = true;
  }

  async saveProfile() {
    if (this.savingProfile) return;
    this.savingProfile = true;
    try {
      const result = await this.auth.updateProfile(this.editName, this.editEmail);
      if (!result.ok) {
        await this.feedback.error(result.error);
        return;
      }
      this.ionViewWillEnter(); // re-read the stored name / email
      this.profileOpen = false;
      void this.feedback.success('Profile updated.');
    } finally {
      this.savingProfile = false;
    }
  }

  // ---- Change password ----
  openPassword() {
    this.currentPassword = this.newPassword = this.confirmPassword = '';
    this.passwordOpen = true;
  }

  async savePassword() {
    if (this.savingPassword) return;
    this.savingPassword = true;
    try {
      const result = await this.auth.changePassword(this.currentPassword, this.newPassword, this.confirmPassword);
      if (!result.ok) {
        await this.feedback.error(result.error);
        return;
      }
      this.passwordOpen = false;
      this.currentPassword = this.newPassword = this.confirmPassword = '';
      void this.feedback.success('Password updated.');
    } finally {
      this.savingPassword = false;
    }
  }

  async logout() {
    const alert = await this.alertCtrl.create({
      header: 'Confirm Logout',
      message: 'Are you sure you want to log out?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Logout',
          handler: () => {
            this.auth.logout();
            void this.router.navigate(['/home'], { replaceUrl: true });
          },
        },
      ],
    });
    await alert.present();
  }
}
