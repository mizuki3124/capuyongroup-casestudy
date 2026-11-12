import { Component } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonHeader, IonIcon, IonInput, IonSpinner, IonToolbar } from '@ionic/angular/standalone';
import { ConnectivityService } from '../core/connectivity.service';
import { formatMoney } from '../core/expense-utils';
import { ExpenseService } from '../core/expense.service';
import { FeedbackService } from '../core/feedback.service';
import { BottomNavComponent } from '../shared/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-expenses-amount',
  templateUrl: './expenses-amount.page.html',
  styleUrls: ['./expenses-amount.page.scss'],
  imports: [FormsModule, RouterLink, BottomNavComponent, IonHeader, IonToolbar, IonContent, IonInput, IonButton, IonIcon, IonSpinner],
})
export class ExpensesAmountPage {
  /** "Set balance" field: replaces the wallet amount. */
  wallet = '';
  /** "Add to balance" field: tops up the wallet. */
  addAmount = '';
  totalBalance = 0;
  saving = false;
  loadingBalance = true;
  readonly formatMoney = formatMoney;

  private active = false;

  constructor(
    private expenseService: ExpenseService,
    private router: Router,
    private feedback: FeedbackService,
    private net: ConnectivityService,
  ) {
    this.net.refresh$.pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.active) void this.loadBalance();
    });
  }

  async ionViewWillEnter() {
    this.wallet = this.addAmount = '';
    this.saving = false;
    this.active = true;
    await this.loadBalance();
  }

  ionViewWillLeave() {
    this.active = false;
  }

  private async loadBalance() {
    this.loadingBalance = true;
    this.totalBalance = await this.expenseService.getWallet();
    this.loadingBalance = false;
  }

  async saveBalance() {
    if (this.saving) return;
    const hasSet = this.wallet !== '' && this.wallet !== null;
    const hasAdd = this.addAmount !== '' && this.addAmount !== null;

    if (!hasSet && !hasAdd) {
      this.reset();
      return this.feedback.error('Please fill in one of the two fields.');
    }
    if (hasSet && hasAdd) {
      this.reset();
      return this.feedback.error("Please don't fill in both fields.");
    }

    this.saving = true;
    let result;
    try {
      result = await (hasSet
        ? this.expenseService.setWallet(Number(this.wallet))
        : this.expenseService.topUp(Number(this.addAmount)));
    } finally {
      this.saving = false;
    }

    if (!result.ok) {
      return this.feedback.error(result.error);
    }
    await this.feedback.success(hasSet ? 'Balance changed successfully!' : 'Amount added to your balance!');
    await this.router.navigate(['/records']);
  }

  private reset() {
    this.wallet = this.addAmount = '';
  }
}
