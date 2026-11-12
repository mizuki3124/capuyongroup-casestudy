import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { StorageService } from './storage.service';

export const TOKEN_KEY = 'expensesave:token';

/** Every endpoint answers { success, message?, data?, errors? } (same shape as the students API). */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string>;
}

/** Thin wrapper around HttpClient: adds the auth token and never throws - failures become { success: false }. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(
    private http: HttpClient,
    private storage: StorageService,
    private router: Router,
  ) {}

  /** JSON request (GET / POST / PUT / DELETE). */
  request<T = unknown>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: unknown,
  ): Promise<ApiResponse<T>> {
    return this.send<T>(method, path, body, true);
  }

  /** multipart/form-data upload (the browser sets the Content-Type and boundary itself). */
  upload<T = unknown>(path: string, form: FormData): Promise<ApiResponse<T>> {
    return this.send<T>('POST', path, form, false);
  }

  /** Downloads a file as a Blob (used for photos, so the ngrok warning page header can be sent). */
  async blob(url: string): Promise<Blob | null> {
    try {
      return await firstValueFrom(
        this.http.get(url, {
          responseType: 'blob',
          headers: new HttpHeaders({ 'ngrok-skip-browser-warning': 'true' }),
        }),
      );
    } catch {
      return null;
    }
  }

  private async send<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body: unknown,
    json: boolean,
  ): Promise<ApiResponse<T>> {
    let headers = new HttpHeaders({
      // Skips ngrok's browser warning page, which would otherwise be returned instead of your JSON
      'ngrok-skip-browser-warning': 'true',
    });
    if (json) headers = headers.set('Content-Type', 'application/json');
    const token = this.storage.get<string | null>(TOKEN_KEY, null);
    if (token) headers = headers.set('X-Auth-Token', token);

    try {
      return await firstValueFrom(
        this.http.request<ApiResponse<T>>(
          method,
          `${environment.apiUrl}/${path}`,
          { body, headers },
        ),
      );
    } catch (e) {
      const err = e as HttpErrorResponse;

      if (err.status === 0) {
        return {
          success: false,
          message:
            'Cannot reach the server. Check XAMPP, ngrok and your connection.',
        };
      }

      // Token expired or replaced (e.g. you logged in on another device): send the user back to sign in.
      // Skip auth.php so a wrong password on the login screen doesn't trigger this.
      if (err.status === 401 && token && !path.startsWith('auth.php')) {
        this.storage.remove(TOKEN_KEY);
        this.router.navigate(['/home'], { replaceUrl: true });
        return {
          success: false,
          message: 'Your session expired. Please sign in again.',
        };
      }

      // The API sends { success: false, message } for 400 / 401 / 404 / 409 / 422 / 500
      return {
        success: false,
        message: err.error?.message ?? 'Something went wrong.',
        errors: err.error?.errors,
      };
    }
  }
}
