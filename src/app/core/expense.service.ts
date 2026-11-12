import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ApiResponse, ApiService } from './api.service';
import { toLocalIsoDate } from './expense-utils';
import { Expense, PhotoRef, Result } from './models';

export interface NewExpense {
  content: string;
  descript: string;
  choice: string;
  cash: number;
}

/** Like Result, but a successful add also hands back the saved expense (its id is needed to attach photos). */
export type AddResult = { ok: true; expense?: Expense } | { ok: false; error: string };

/** The server sends numeric ids and (from v2) a photos array; the app treats expense ids as strings. */
function toExpense(e: Expense): Expense {
  return { ...e, id: String(e.id), photos: e.photos ?? [] };
}

/** CRUD for expenses and the wallet, using HttpClient (GET / POST / PUT / DELETE) against the PHP + MySQL API. */
@Injectable({ providedIn: 'root' })
export class ExpenseService {
  /** The last list that was loaded, so the detail / edit pages can open instantly. */
  private cache: Expense[] = [];

  /** Fires after something changed from outside the visible page (e.g. "Undo" brought an expense back). */
  readonly changed$ = new Subject<void>();

  constructor(private api: ApiService) {}

  private toResult(res: ApiResponse): Result {
    return res.success ? { ok: true } : { ok: false, error: res.message ?? 'Something went wrong.' };
  }

  // ---- Read (GET) ----
  async list(): Promise<Expense[]> {
    const res = await this.api.request<Expense[]>('GET', 'expenses.php');
    if (res.success && res.data) {
      this.cache = res.data.map(toExpense);
      return this.cache;
    }
    return [];
  }

  /** One expense by id: from the last loaded list when possible, otherwise the list is fetched again. */
  async getById(id: string): Promise<Expense | null> {
    const cached = this.cache.find((e) => e.id === id);
    if (cached) return cached;
    return (await this.list()).find((e) => e.id === id) ?? null;
  }

  /** The last list that was loaded (may be empty before the first load). */
  cached(): Expense[] {
    return this.cache;
  }

  async getWallet(): Promise<number> {
    const res = await this.api.request<{ wallet: number }>('GET', 'wallet.php');
    return res.success && res.data ? Number(res.data.wallet) : 0;
  }

  // ---- Create (POST) ----
  async add(input: NewExpense): Promise<AddResult> {
    const err = this.validate(input.content, input.descript, input.cash);
    if (err) return { ok: false, error: err };
    const res = await this.api.request<Expense>('POST', 'expenses.php', {
      content: input.content.trim(),
      descript: input.descript.trim(),
      choice: input.choice,
      cash: input.cash,
      date: toLocalIsoDate(new Date()),
    });
    if (!res.success) return { ok: false, error: res.message ?? 'Something went wrong.' };
    return { ok: true, expense: res.data ? toExpense(res.data) : undefined };
  }

  // ---- Update (PUT) ----
  async update(id: string, changes: { content: string; descript: string; cash: number }): Promise<Result> {
    const err = this.validate(changes.content, changes.descript, changes.cash);
    if (err) return { ok: false, error: err };
    return this.toResult(await this.api.request('PUT', `expenses.php?id=${encodeURIComponent(id)}`, changes));
  }

  // ---- Delete (DELETE): the server hides the expense and refunds the amount, so it can be undone ----
  async remove(id: string): Promise<Result> {
    return this.toResult(await this.api.request('DELETE', `expenses.php?id=${encodeURIComponent(id)}`));
  }

  // ---- Undo delete (POST ?action=restore): brings the expense back and takes the refund out again ----
  async restore(id: string): Promise<Result> {
    return this.toResult(
      await this.api.request('POST', `expenses.php?id=${encodeURIComponent(id)}&action=restore`, {}),
    );
  }

  // ---- Wallet ----
  /** Replaces the wallet balance. */
  async setWallet(amount: number): Promise<Result> {
    if (!Number.isFinite(amount) || amount < 0) return { ok: false, error: 'Please enter a valid amount.' };
    return this.toResult(await this.api.request('PUT', 'wallet.php', { amount }));
  }

  /** Adds money to the wallet balance. */
  async topUp(amount: number): Promise<Result> {
    if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: 'Please enter an amount greater than 0.' };
    return this.toResult(await this.api.request('POST', 'wallet.php', { amount }));
  }

  // ---- Photos (up to 3 per expense) ----
  async uploadPhoto(expenseId: string, photo: Blob): Promise<{ ok: true; photo: PhotoRef } | { ok: false; error: string }> {
    const form = new FormData();
    form.append('photo', photo, 'photo.jpg');
    const res = await this.api.upload<PhotoRef>(`photos.php?expense_id=${encodeURIComponent(expenseId)}`, form);
    return res.success && res.data
      ? { ok: true, photo: res.data }
      : { ok: false, error: res.message ?? 'Could not upload the picture.' };
  }

  async deletePhoto(photoId: number): Promise<Result> {
    return this.toResult(await this.api.request('DELETE', `photos.php?id=${photoId}`));
  }

  private validate(content: string, descript: string, cash: number): string | null {
    if (!content?.trim() || !descript?.trim()) return 'All fields are required!';
    if (!Number.isFinite(cash) || cash <= 0) return 'Please enter an amount greater than 0.';
    return null;
  }
}
