import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { IonButton, IonIcon, IonModal } from '@ionic/angular/standalone';
import {
  CalendarCell, MONTHS_LONG, buildCalendar, formatShortDate, isInDateRange, toLocalIsoDate,
} from '../../core/expense-utils';
import { DateRange, Expense } from '../../core/models';

/**
 * Bottom sheet with a month calendar. Tap a first day, then a last day, to pick a range.
 * A small dot under a day means there is at least one expense on it.
 */
@Component({
  selector: 'app-date-range-sheet',
  templateUrl: './date-range-sheet.component.html',
  styleUrls: ['./date-range-sheet.component.scss'],
  imports: [IonModal, IonButton, IonIcon],
})
export class DateRangeSheetComponent implements OnChanges {
  @Input() open = false;
  /** All expenses (not filtered), used for the dots and for the "Show N expenses" count. */
  @Input() expenses: Expense[] = [];
  /** The range that is currently applied, if any. */
  @Input() range: DateRange | null = null;

  /** Emits the chosen range, or null for "Clear". */
  @Output() apply = new EventEmitter<DateRange | null>();
  @Output() closed = new EventEmitter<void>();

  readonly weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  readonly today = toLocalIsoDate(new Date());

  year = new Date().getFullYear();
  month = new Date().getMonth();
  weeks: CalendarCell[][] = [];
  start: string | null = null;
  end: string | null = null;
  private withExpenses = new Set<string>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['expenses']) this.withExpenses = new Set(this.expenses.map((e) => e.date));

    if (changes['open'] && this.open) {
      // Every time the sheet opens, start from the applied range (or today).
      this.start = this.range?.from ?? null;
      this.end = this.range?.to ?? null;
      const anchor = this.start ? new Date(Number(this.start.slice(0, 4)), Number(this.start.slice(5, 7)) - 1, 1) : new Date();
      this.year = anchor.getFullYear();
      this.month = anchor.getMonth();
      this.draw();
    }
  }

  get title(): string {
    return `${MONTHS_LONG[this.month]} ${this.year}`;
  }

  /** "Nov 3 to Nov 9", or just "Nov 3" while only the first day is picked. */
  get label(): string {
    if (!this.start) return '';
    if (!this.end || this.end === this.start) return formatShortDate(this.start);
    return `${formatShortDate(this.start)} to ${formatShortDate(this.end)}`;
  }

  /** How many expenses fall inside the picked range. */
  get matchCount(): number {
    if (!this.start) return 0;
    const to = this.end ?? this.start;
    return this.expenses.filter((e) => isInDateRange(e.date, this.start as string, to)).length;
  }

  prev(): void {
    this.shift(-1);
  }

  next(): void {
    this.shift(1);
  }

  private shift(by: number): void {
    const d = new Date(this.year, this.month + by, 1);
    this.year = d.getFullYear();
    this.month = d.getMonth();
    this.draw();
  }

  private draw(): void {
    this.weeks = buildCalendar(this.year, this.month);
  }

  pick(cell: CalendarCell): void {
    if (!cell.iso) return;
    if (!this.start || this.end !== null) {
      this.start = cell.iso; // start a new range
      this.end = null;
    } else {
      // second tap closes the range (in either direction)
      if (cell.iso < this.start) {
        this.end = this.start;
        this.start = cell.iso;
      } else {
        this.end = cell.iso;
      }
    }
  }

  hasExpenses(cell: CalendarCell): boolean {
    return !!cell.iso && this.withExpenses.has(cell.iso);
  }

  isEdge(cell: CalendarCell): boolean {
    return !!cell.iso && (cell.iso === this.start || cell.iso === this.end);
  }

  isMiddle(cell: CalendarCell): boolean {
    if (!cell.iso || !this.start || !this.end) return false;
    return cell.iso > this.start && cell.iso < this.end;
  }

  clear(): void {
    this.start = this.end = null;
    this.apply.emit(null);
  }

  confirm(): void {
    if (!this.start) return;
    this.apply.emit({ from: this.start, to: this.end ?? this.start });
  }
}
