import { Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonToolbar,
  NavController,
} from '@ionic/angular/standalone';
import { ConnectivityService } from '../core/connectivity.service';
import {
  filterByDateRange,
  filterByRange,
  formatMoney,
  formatShortDate,
  groupByDate,
  searchExpenses,
  sumCash,
} from '../core/expense-utils';
import { ExpenseService } from '../core/expense.service';
import {
  CATEGORIES,
  DateRange,
  Expense,
  GroupedExpenses,
  RangeKey,
} from '../core/models';
import { BottomNavComponent } from '../shared/bottom-nav/bottom-nav.component';
import { DateRangeSheetComponent } from '../shared/date-range-sheet/date-range-sheet.component';

@Component({
  selector: 'app-records',
  templateUrl: './records.page.html',
  styleUrls: ['./records.page.scss'],
  imports: [
    FormsModule,
    NgClass,
    RouterLink,
    BottomNavComponent,
    DateRangeSheetComponent,
    IonHeader,
    IonToolbar,
    IonContent,
    IonIcon,
    IonButton,
  ],
})
export class RecordsPage implements OnInit {
  expenses: Expense[] = [];
  filtered: Expense[] = [];
  grouped: GroupedExpenses[] = [];
  totalExpenses = 0;
  wallet = 0;

  /** The quick chip that is on (ignored while a custom date range is applied). */
  selectedRange: RangeKey = 'all';
  /** Range picked on the calendar. */
  customRange: DateRange | null = null;
  query = '';

  /** True until the first list has arrived: shows grey placeholder rows instead of "No records". */
  loading = true;
  calendarOpen = false;

  readonly skeletonRows = [0, 1, 2];
  /** One-tap ranges; "Pick dates" opens the calendar for anything else. */
  readonly quickRanges: { label: string; value: RangeKey }[] = [
    { label: 'Today', value: 'thisDay' },
    { label: 'Week', value: 'thisWeek' },
    { label: 'Month', value: 'thisMonth' },
    { label: 'All', value: 'all' },
  ];
  readonly formatMoney = formatMoney;

  private active = false;

  constructor(
    private destroyRef: DestroyRef,
    private expenseService: ExpenseService,
    private navCtrl: NavController,
    private net: ConnectivityService,
  ) {}

  ngOnInit() {
    // "Tap to refresh" on the Back online banner, or "Undo" from the delete toast.
    this.net.refresh$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reloadIfActive());
    this.expenseService.changed$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reloadIfActive());
  }

  /** Ionic lifecycle: runs every time the page becomes visible, so data is always fresh. */
  ionViewWillEnter() {
    this.active = true;
    const cached = this.expenseService.cached();
    if (cached.length) {
      this.expenses = cached; // show what we have straight away, then refresh below
      this.applyFilter();
      this.loading = false;
    }
    void this.load();
  }

  ionViewWillLeave() {
    this.active = false;
  }

  private reloadIfActive() {
    if (this.active) void this.load();
  }

  iconFor(category: string): string {
    return CATEGORIES.find((c) => c.name === category)?.icon ?? 'help-outline';
  }

  /** Tint class for a category, matching the order of CATEGORIES. */
  toneFor(category: string): string {
    const index = CATEGORIES.findIndex((c) => c.name === category);
    return index >= 0 ? `tone-${index}` : 'tone-x';
  }

  /** Share of all funds (balance + spent) that the shown expenses represent, 0-100. */
  get spentPct(): number {
    const total = this.wallet + this.totalExpenses;
    return total > 0
      ? Math.min(100, Math.round((this.totalExpenses / total) * 100))
      : 0;
  }

  get searching(): boolean {
    return this.query.trim().length > 0;
  }

  get customLabel(): string {
    if (!this.customRange) return 'Pick dates';
    const { from, to } = this.customRange;
    return from === to
      ? formatShortDate(from)
      : `${formatShortDate(from)} to ${formatShortDate(to)}`;
  }

  isOn(range: RangeKey): boolean {
    return !this.customRange && this.selectedRange === range;
  }

  setRange(range: RangeKey) {
    this.customRange = null;
    this.selectedRange = range;
    this.applyFilter();
  }

  openCalendar() {
    this.calendarOpen = true;
  }

  onRangeChosen(range: DateRange | null) {
    this.calendarOpen = false;
    this.customRange = range;
    if (!range) this.selectedRange = 'all';
    this.applyFilter();
  }

  async load() {
    const [expenses, wallet] = await Promise.all([
      this.expenseService.list(),
      this.expenseService.getWallet(),
    ]);
    this.expenses = expenses;
    this.wallet = wallet;
    this.loading = false;
    this.applyFilter();
  }

  applyFilter() {
    const byDate = this.customRange
      ? filterByDateRange(
          this.expenses,
          this.customRange.from,
          this.customRange.to,
        )
      : filterByRange(this.expenses, this.selectedRange);
    this.filtered = searchExpenses(byDate, this.query);
    this.grouped = groupByDate(this.filtered);
    this.totalExpenses = sumCash(this.filtered);
  }

  clearSearch() {
    this.query = '';
    this.applyFilter();
  }

  openExpense(expense: Expense) {
    void this.navCtrl.navigateForward(['/expense', expense.id]);
  }
}
