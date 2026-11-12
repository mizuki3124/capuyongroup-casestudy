/** One picture attached to an expense, as stored on the server. */
export interface PhotoRef {
  id: number;
  /** Long random file name on the server (e.g. 3f9a...c1.jpg). */
  file: string;
}

/** One tile in the photo grid: either a picture already on the server (`file`) or a new one (`src`). */
export interface PhotoItem {
  key: string;
  /** Local preview of a new picture. */
  src?: string;
  /** File name of a stored picture. */
  file?: string;
  /** Database id of a stored picture. */
  photoId?: number;
  /** The new picture is being uploaded right now. */
  uploading?: boolean;
}

/** An expense can carry at most this many pictures. */
export const MAX_PHOTOS = 3;

/** A single expense entry saved in the database. */
export interface Expense {
  id: string;
  /** Amount in PHP. */
  cash: number;
  descript: string;
  /** Short name of what was bought (e.g. "Lunch"). */
  content: string;
  /** Category name – one of CATEGORIES. */
  choice: string;
  /** Local calendar date, formatted YYYY-MM-DD. */
  date: string;
  /** Pictures attached to this expense (0 to MAX_PHOTOS). */
  photos: PhotoRef[];
}

/** An inclusive date range picked on the calendar, both ends formatted YYYY-MM-DD. */
export interface DateRange {
  from: string;
  to: string;
}

export interface GroupedExpenses {
  date: string;
  items: Expense[];
  total: number;
}

/** The signed-in user, as returned by the API. */
export interface UserAccount {
  name: string;
  email: string;
}

export type RangeKey =
  | 'thisDay' | 'lastDay'
  | 'thisWeek' | 'lastWeek'
  | 'thisMonth' | 'lastMonth'
  | 'thisYear' | 'lastYear'
  | 'all';

export interface Category {
  name: string;
  icon: string;
}

/** Single source of truth for the expense categories (used by the menu and the records list). */
export const CATEGORIES: Category[] = [
  { name: 'Food', icon: 'restaurant-outline' },
  { name: 'Education', icon: 'school-outline' },
  { name: 'Entertainment', icon: 'game-controller-outline' },
  { name: 'Travel', icon: 'compass-outline' },
  { name: 'Shopping', icon: 'cart-outline' },
  { name: 'Health', icon: 'medkit-outline' },
  { name: 'Transportation', icon: 'bus-outline' },
];

export const RANGE_OPTIONS: { label: string; value: RangeKey }[] = [
  { label: 'This Day', value: 'thisDay' },
  { label: 'Last Day', value: 'lastDay' },
  { label: 'This Week', value: 'thisWeek' },
  { label: 'Last Week', value: 'lastWeek' },
  { label: 'This Month', value: 'thisMonth' },
  { label: 'Last Month', value: 'lastMonth' },
  { label: 'This Year', value: 'thisYear' },
  { label: 'Last Year', value: 'lastYear' },
  { label: 'All', value: 'all' },
];

export type Result = { ok: true } | { ok: false; error: string };
