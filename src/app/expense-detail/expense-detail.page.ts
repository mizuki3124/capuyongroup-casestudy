import { Component, DestroyRef, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonSpinner,
  IonToolbar,
  NavController,
} from '@ionic/angular/standalone';
import { ConnectivityService } from '../core/connectivity.service';
import { formatLongDate, formatMoney } from '../core/expense-utils';
import { ExpenseService } from '../core/expense.service';
import { FeedbackService } from '../core/feedback.service';
import { CATEGORIES, Expense } from '../core/models';
import { BottomNavComponent } from '../shared/bottom-nav/bottom-nav.component';
import { PhotoImgComponent } from '../shared/photo-img/photo-img.component';

@Component({
  selector: 'app-expense-detail',
  templateUrl: './expense-detail.page.html',
  styleUrls: ['./expense-detail.page.scss'],
  imports: [
    NgClass,
    BottomNavComponent,
    PhotoImgComponent,
    IonHeader,
    IonToolbar,
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner,
    IonModal,
  ],
})
export class ExpenseDetailPage implements OnInit {
  expense: Expense | null = null;
  loading = true;
  deleting = false;
  /** Picture opened full-size, if any. */
  viewing: string | null = null;

  readonly formatMoney = formatMoney;
  readonly formatLongDate = formatLongDate;
  readonly slots = [0, 1, 2];

  private id = '';
  private active = false;

  constructor(
    private destroyRef: DestroyRef,
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private expenses: ExpenseService,
    private feedback: FeedbackService,
    private net: ConnectivityService,
  ) {}

  ngOnInit() {
    this.net.refresh$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.active) void this.load();
      });
  }

  ionViewWillEnter() {
    this.active = true;
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    this.expense = null;
    this.loading = true;
    void this.load();
  }

  ionViewWillLeave() {
    this.active = false;
  }

  /** Shows the cached copy straight away, then refreshes it from the server. */
  private async load() {
    const cached = this.expenses.cached().find((e) => e.id === this.id) ?? null;
    if (cached) {
      this.expense = cached;
      this.loading = false;
    }

    const latest =
      (await this.expenses.list()).find((e) => e.id === this.id) ?? null;
    this.loading = false;
    if (latest) {
      this.expense = latest;
    } else if (!this.expense) {
      void this.feedback.error('That expense could not be found.');
      void this.navCtrl.navigateBack('/records');
    }
  }

  get toneClass(): string {
    const index = CATEGORIES.findIndex((c) => c.name === this.expense?.choice);
    return index >= 0 ? `tone-${index}` : 'tone-x';
  }

  get categoryIcon(): string {
    return (
      CATEGORIES.find((c) => c.name === this.expense?.choice)?.icon ??
      'help-outline'
    );
  }

  back() {
    void this.navCtrl.navigateBack('/records');
  }

  edit() {
    void this.navCtrl.navigateForward(['/expense', this.id, 'edit']);
  }

  /** Deletes straight away (the money is refunded) and offers Undo in a toast. */
  async remove() {
    const expense = this.expense;
    if (!expense || this.deleting) return;

    this.deleting = true;
    void this.feedback.warn();
    const result = await this.expenses.remove(expense.id);
    this.deleting = false;

    if (!result.ok) {
      void this.feedback.error(result.error);
      return;
    }

    await this.navCtrl.navigateBack('/records');
    void this.feedback.undo(`Deleted ${expense.content}`, async () => {
      const undone = await this.expenses.restore(expense.id);
      if (undone.ok) {
        void this.feedback.success('Expense restored.');
        this.expenses.changed$.next(); // the Records page reloads itself
      } else {
        void this.feedback.error(undone.error);
      }
    });
  }
}
