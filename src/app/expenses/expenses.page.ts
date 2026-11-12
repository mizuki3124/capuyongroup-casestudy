import { Component } from '@angular/core';
import { NgClass } from '@angular/common';
import { NavController, IonContent, IonHeader, IonIcon, IonToolbar } from '@ionic/angular/standalone';
import { FeedbackService } from '../core/feedback.service';
import { CATEGORIES } from '../core/models';
import { BottomNavComponent } from '../shared/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.page.html',
  styleUrls: ['./expenses.page.scss'],
  imports: [NgClass, BottomNavComponent, IonHeader, IonToolbar, IonContent, IonIcon],
})
export class ExpensesPage {
  readonly categories = CATEGORIES;

  constructor(private navCtrl: NavController, private feedback: FeedbackService) {}

  goToInput(category: string) {
    void this.feedback.tap(); // haptic tick on selection
    this.navCtrl.navigateForward(['/expenses-input', category]);
  }
}
