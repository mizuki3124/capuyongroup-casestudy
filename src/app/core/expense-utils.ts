import { Expense, GroupedExpenses, RangeKey } from './models';

/** Midnight (local time) of the given date. */
const startOfDay = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const addDays = (d: Date, days: number): Date => {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
};

/** Formats a Date as a LOCAL YYYY-MM-DD string (toISOString() would use UTC and shift the day). */
export function toLocalIsoDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Parses a YYYY-MM-DD string as a LOCAL date (new Date('YYYY-MM-DD') would be UTC). */
export function parseLocalIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** True when the given YYYY-MM-DD date falls inside the selected range, relative to `now`. */
export function isInRange(iso: string, range: RangeKey, now: Date = new Date()): boolean {
  const day = parseLocalIsoDate(iso);
  const today = startOfDay(now);

  switch (range) {
    case 'thisDay':
      return day.getTime() === today.getTime();
    case 'lastDay':
      return day.getTime() === addDays(today, -1).getTime();
    case 'thisWeek': {
      const weekStart = addDays(today, -today.getDay());
      return day >= weekStart && day < addDays(weekStart, 7);
    }
    case 'lastWeek': {
      const thisWeekStart = addDays(today, -today.getDay());
      return day >= addDays(thisWeekStart, -7) && day < thisWeekStart;
    }
    case 'thisMonth':
      return day.getFullYear() === today.getFullYear() && day.getMonth() === today.getMonth();
    case 'lastMonth': {
      const lm = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      return day.getFullYear() === lm.getFullYear() && day.getMonth() === lm.getMonth();
    }
    case 'thisYear':
      return day.getFullYear() === today.getFullYear();
    case 'lastYear':
      return day.getFullYear() === today.getFullYear() - 1;
    default:
      return true;
  }
}

export function filterByRange(expenses: Expense[], range: RangeKey, now: Date = new Date()): Expense[] {
  return expenses.filter((e) => isInRange(e.date, range, now));
}

export function sumCash(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.cash, 0);
}

/** Groups expenses by date (newest day first) and computes each day's total. */
export function groupByDate(expenses: Expense[]): GroupedExpenses[] {
  const groups = new Map<string, Expense[]>();
  for (const e of expenses) {
    const list = groups.get(e.date) ?? [];
    list.push(e);
    groups.set(e.date, list);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0)) // ISO dates sort lexicographically
    .map(([date, items]) => ({ date, items, total: sumCash(items) }));
}

export function formatMoney(amount: number): string {
  return amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ---------------------------------------------------------------------------
// v2: custom date range, search and calendar helpers
// ---------------------------------------------------------------------------

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** "2026-11-03" -> "Nov 3" */
export function formatShortDate(iso: string): string {
  const d = parseLocalIsoDate(iso);
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

/** "2026-11-11" -> "Nov 11, 2026" */
export function formatLongDate(iso: string): string {
  const d = parseLocalIsoDate(iso);
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** True when `iso` is between `from` and `to` (inclusive). ISO dates compare correctly as plain strings. */
export function isInDateRange(iso: string, from: string, to: string): boolean {
  const [a, b] = from <= to ? [from, to] : [to, from];
  return iso >= a && iso <= b;
}

export function filterByDateRange(expenses: Expense[], from: string, to: string): Expense[] {
  return expenses.filter((e) => isInDateRange(e.date, from, to));
}

/** Case-insensitive search over the name, description and category. An empty query keeps everything. */
export function searchExpenses(expenses: Expense[], query: string): Expense[] {
  const q = query.trim().toLowerCase();
  if (!q) return expenses;
  return expenses.filter((e) =>
    `${e.content} ${e.descript} ${e.choice}`.toLowerCase().includes(q),
  );
}

export interface CalendarCell {
  /** YYYY-MM-DD, or null for the empty cells before day 1. */
  iso: string | null;
  day: number | null;
}

/** Weeks (Sunday first) of the given month; `month` is 0-11. */
export function buildCalendar(year: number, month: number): CalendarCell[][] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let i = 0; i < first.getDay(); i++) cells.push({ iso: null, day: null });
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ iso: toLocalIsoDate(new Date(year, month, day)), day });
  }
  while (cells.length % 7 !== 0) cells.push({ iso: null, day: null });

  const weeks: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
