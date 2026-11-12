import {
  buildCalendar, filterByDateRange, filterByRange, formatMoney, formatShortDate, groupByDate, isInDateRange, isInRange,
  parseLocalIsoDate, searchExpenses, sumCash, toLocalIsoDate,
} from './expense-utils';
import { Expense } from './models';

const exp = (id: string, date: string, cash: number): Expense => ({
  id, date, cash, content: 'x', descript: 'y', choice: 'Food', photos: [],
});

describe('expense-utils', () => {
  // Wednesday, 15 Oct 2025, 23:30 local time (late evening on purpose: catches time-of-day bugs)
  const now = new Date(2025, 9, 15, 23, 30);

  it('formats a local date without shifting the day (no UTC conversion)', () => {
    expect(toLocalIsoDate(new Date(2025, 0, 5, 0, 10))).toBe('2025-01-05');
    expect(toLocalIsoDate(new Date(2025, 11, 31, 23, 59))).toBe('2025-12-31');
  });

  it('parses YYYY-MM-DD as local midnight', () => {
    const d = parseLocalIsoDate('2025-10-15');
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2025, 9, 15, 0]);
  });

  it('thisDay / lastDay', () => {
    expect(isInRange('2025-10-15', 'thisDay', now)).toBeTrue();
    expect(isInRange('2025-10-14', 'thisDay', now)).toBeFalse();
    expect(isInRange('2025-10-14', 'lastDay', now)).toBeTrue();
    expect(isInRange('2025-10-13', 'lastDay', now)).toBeFalse();
  });

  it('thisWeek includes Sunday (week start) and excludes next week', () => {
    expect(isInRange('2025-10-12', 'thisWeek', now)).toBeTrue();  // Sunday
    expect(isInRange('2025-10-18', 'thisWeek', now)).toBeTrue();  // Saturday
    expect(isInRange('2025-10-11', 'thisWeek', now)).toBeFalse();
    expect(isInRange('2025-10-19', 'thisWeek', now)).toBeFalse();
  });

  it('lastWeek is the 7 days before this week', () => {
    expect(isInRange('2025-10-05', 'lastWeek', now)).toBeTrue();
    expect(isInRange('2025-10-11', 'lastWeek', now)).toBeTrue();
    expect(isInRange('2025-10-12', 'lastWeek', now)).toBeFalse();
    expect(isInRange('2025-10-04', 'lastWeek', now)).toBeFalse();
  });

  it('month and year ranges, including the January -> December rollover', () => {
    expect(isInRange('2025-10-01', 'thisMonth', now)).toBeTrue();
    expect(isInRange('2025-09-30', 'lastMonth', now)).toBeTrue();
    expect(isInRange('2025-01-01', 'thisYear', now)).toBeTrue();
    expect(isInRange('2024-12-31', 'lastYear', now)).toBeTrue();
    const jan = new Date(2026, 0, 10);
    expect(isInRange('2025-12-20', 'lastMonth', jan)).toBeTrue();
  });

  it('"all" accepts everything', () => {
    expect(isInRange('1999-01-01', 'all', now)).toBeTrue();
  });

  it('filterByRange keeps only matching expenses', () => {
    const list = [exp('1', '2025-10-15', 10), exp('2', '2025-09-01', 20)];
    expect(filterByRange(list, 'thisMonth', now).map((e) => e.id)).toEqual(['1']);
  });

  it('sumCash adds amounts', () => {
    expect(sumCash([exp('1', '2025-10-15', 10.5), exp('2', '2025-10-15', 4.5)])).toBe(15);
    expect(sumCash([])).toBe(0);
  });

  it('groupByDate sorts newest first and totals each day', () => {
    const groups = groupByDate([
      exp('1', '2025-10-01', 5),
      exp('2', '2025-10-03', 7),
      exp('3', '2025-10-03', 3),
    ]);
    expect(groups.map((g) => g.date)).toEqual(['2025-10-03', '2025-10-01']);
    expect(groups[0].total).toBe(10);
    expect(groups[0].items.length).toBe(2);
  });

  it('formatMoney always shows two decimals', () => {
    expect(formatMoney(1500)).toBe('1,500.00');
    expect(formatMoney(0.5)).toBe('0.50');
  });

  it('isInDateRange is inclusive and accepts the two ends in either order', () => {
    expect(isInDateRange('2026-11-05', '2026-11-03', '2026-11-09')).toBeTrue();
    expect(isInDateRange('2026-11-03', '2026-11-03', '2026-11-09')).toBeTrue();
    expect(isInDateRange('2026-11-09', '2026-11-03', '2026-11-09')).toBeTrue();
    expect(isInDateRange('2026-11-10', '2026-11-03', '2026-11-09')).toBeFalse();
    expect(isInDateRange('2026-11-05', '2026-11-09', '2026-11-03')).toBeTrue();
  });

  it('filterByDateRange keeps only expenses inside the picked days', () => {
    const list = [exp('1', '2026-11-02', 1), exp('2', '2026-11-03', 2), exp('3', '2026-11-09', 3), exp('4', '2026-11-10', 4)];
    expect(filterByDateRange(list, '2026-11-03', '2026-11-09').map((e) => e.id)).toEqual(['2', '3']);
  });

  it('searchExpenses matches name, description and category, ignoring case', () => {
    const list = [
      { ...exp('1', '2026-11-01', 5), content: 'Jeep fare', descript: 'To school', choice: 'Transport' },
      { ...exp('2', '2026-11-01', 5), content: 'Lunch', descript: 'Rice meal', choice: 'Food' },
    ];
    expect(searchExpenses(list, 'RICE').map((e) => e.id)).toEqual(['2']);
    expect(searchExpenses(list, 'transport').map((e) => e.id)).toEqual(['1']);
    expect(searchExpenses(list, '  ').length).toBe(2);
    expect(searchExpenses(list, 'zzz')).toEqual([]);
  });

  it('formatShortDate prints "Nov 3"', () => {
    expect(formatShortDate('2026-11-03')).toBe('Nov 3');
  });

  it('buildCalendar lays out November 2026 (starts on a Sunday, 30 days)', () => {
    const weeks = buildCalendar(2026, 10);
    expect(weeks.length).toBe(5);
    expect(weeks.every((w) => w.length === 7)).toBeTrue();
    expect(weeks[0][0].iso).toBe('2026-11-01');
    const days = weeks.flat().filter((c) => c.iso);
    expect(days.length).toBe(30);
    expect(days[29].iso).toBe('2026-11-30');
  });

  it('buildCalendar pads the first week with empty cells (May 2026 starts on a Friday)', () => {
    const weeks = buildCalendar(2026, 4);
    expect(weeks[0].slice(0, 5).every((c) => c.iso === null)).toBeTrue();
    expect(weeks[0][5].iso).toBe('2026-05-01');
  });
});
