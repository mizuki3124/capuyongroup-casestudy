import { Injectable } from '@angular/core';
import { ApiService, TOKEN_KEY } from './api.service';
import { Result, UserAccount } from './models';
import { StorageService } from './storage.service';

const USER_KEY = 'expensesave:user';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Accounts live in MySQL (through the PHP API). Only the login session (token + display name/email)
 * is remembered on the device so the user stays signed in after a refresh.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private api: ApiService, private storage: StorageService) {}

  async register(name: string, email: string, password: string, confirm: string): Promise<Result> {
    name = name.trim();
    email = email.trim().toLowerCase();

    if (!name || !email || !password || !confirm) return { ok: false, error: 'All fields are required.' };
    if (!EMAIL_RE.test(email)) return { ok: false, error: 'Please enter a valid email address.' };
    if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };
    if (password !== confirm) return { ok: false, error: 'Passwords do not match.' };

    const res = await this.api.request('POST', 'auth.php?action=register', { name, email, password });
    return res.success ? { ok: true } : { ok: false, error: res.message ?? 'Sign up failed.' };
  }

  async login(email: string, password: string): Promise<Result> {
    email = email.trim().toLowerCase();
    if (!email || !password) return { ok: false, error: 'Please enter your email and password.' };

    const res = await this.api.request<{ token: string; user: UserAccount }>('POST', 'auth.php?action=login', {
      email,
      password,
    });
    if (!res.success || !res.data) return { ok: false, error: res.message ?? 'Sign in failed.' };

    this.storage.set(TOKEN_KEY, res.data.token);
    this.storage.set(USER_KEY, res.data.user);
    return { ok: true };
  }

  /** Saves a new name / email. The stored session is updated so the Account page shows it straight away. */
  async updateProfile(name: string, email: string): Promise<Result> {
    name = name.trim();
    email = email.trim().toLowerCase();

    if (!name || !email) return { ok: false, error: 'Name and email are required.' };
    if (!EMAIL_RE.test(email)) return { ok: false, error: 'Please enter a valid email address.' };

    const res = await this.api.request<UserAccount>('PUT', 'profile.php', { name, email });
    if (!res.success) return { ok: false, error: res.message ?? 'Could not update your profile.' };

    this.storage.set(USER_KEY, res.data ?? { name, email });
    return { ok: true };
  }

  async changePassword(current: string, next: string, confirm: string): Promise<Result> {
    if (!current || !next || !confirm) return { ok: false, error: 'Please fill in all password fields.' };
    if (next.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };
    if (next !== confirm) return { ok: false, error: 'Passwords do not match.' };

    const res = await this.api.request('POST', 'profile.php?action=password', {
      current_password: current,
      new_password: next,
    });
    return res.success ? { ok: true } : { ok: false, error: res.message ?? 'Could not change your password.' };
  }

  logout(): void {
    void this.api.request('POST', 'auth.php?action=logout'); // invalidate the token on the server
    this.storage.remove(TOKEN_KEY);
    this.storage.remove(USER_KEY);
  }

  currentUser(): UserAccount | null {
    return this.storage.get<UserAccount | null>(USER_KEY, null);
  }

  isLoggedIn(): boolean {
    return this.storage.get<string | null>(TOKEN_KEY, null) !== null && this.currentUser() !== null;
  }
}
