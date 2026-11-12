import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { StorageService } from './storage.service';
import { MemoryStorage } from './testing';

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;
  const url = (action: string) => `${environment.apiUrl}/auth.php?action=${action}`;
  const user = { name: 'Ana', email: 'ana@mail.com' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: StorageService, useClass: MemoryStorage },
      ],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function signIn() {
    const p = auth.login('ana@mail.com', 'secret1');
    http.expectOne(url('login')).flush({ success: true, data: { token: 'tok123', user } });
    return p;
  }

  it('rejects empty, invalid, short and mismatching sign-up input without calling the API', async () => {
    expect((await auth.register('', 'a@b.co', 'secret1', 'secret1')).ok).toBeFalse();
    expect((await auth.register('Ana', 'not-an-email', 'secret1', 'secret1')).ok).toBeFalse();
    expect((await auth.register('Ana', 'a@b.co', '123', '123')).ok).toBeFalse();
    expect((await auth.register('Ana', 'a@b.co', 'secret1', 'secret2')).ok).toBeFalse();
    http.expectNone(url('register'));
  });

  it('register() POSTs the trimmed, lower-cased details', async () => {
    const p = auth.register(' Ana ', ' Ana@Mail.com ', 'secret1', 'secret1');
    const req = http.expectOne(url('register'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Ana', email: 'ana@mail.com', password: 'secret1' });
    req.flush({ success: true, message: 'Account created.' }, { status: 201, statusText: 'Created' });
    expect((await p).ok).toBeTrue();
  });

  it('register() shows the server message for a duplicate email', async () => {
    const p = auth.register('Ana', 'ana@mail.com', 'secret1', 'secret1');
    http.expectOne(url('register')).flush(
      { success: false, message: 'An account with this email already exists.' },
      { status: 409, statusText: 'Conflict' },
    );
    const result = await p;
    expect(result.ok).toBeFalse();
    if (!result.ok) expect(result.error).toContain('already exists');
  });

  it('login() stores the session when the server accepts the password', async () => {
    expect((await signIn()).ok).toBeTrue();
    expect(auth.isLoggedIn()).toBeTrue();
    expect(auth.currentUser()?.name).toBe('Ana');
  });

  it('login() fails and stays signed out on a wrong password', async () => {
    const p = auth.login('ana@mail.com', 'wrong-pass');
    http.expectOne(url('login')).flush(
      { success: false, message: "Account details don't match." },
      { status: 401, statusText: 'Unauthorized' },
    );
    expect((await p).ok).toBeFalse();
    expect(auth.isLoggedIn()).toBeFalse();
  });

  it('reports a friendly error when the server cannot be reached', async () => {
    const p = auth.login('ana@mail.com', 'secret1');
    http.expectOne(url('login')).error(new ProgressEvent('error'));
    const result = await p;
    expect(result.ok).toBeFalse();
    if (!result.ok) expect(result.error).toContain('Cannot reach the server');
  });

  it('logout() clears the session and tells the server', async () => {
    await signIn();
    auth.logout();
    const req = http.expectOne(url('logout'));
    expect(req.request.headers.get('X-Auth-Token')).toBe('tok123');
    req.flush({ success: true });
    expect(auth.isLoggedIn()).toBeFalse();
    expect(auth.currentUser()).toBeNull();
  });

  it('updateProfile() PUTs the trimmed details and updates the stored user', async () => {
    await signIn();
    const p = auth.updateProfile(' Ana Cruz ', ' Ana.Cruz@Mail.com ');
    const req = http.expectOne(`${environment.apiUrl}/profile.php`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ name: 'Ana Cruz', email: 'ana.cruz@mail.com' });
    req.flush({ success: true, data: { name: 'Ana Cruz', email: 'ana.cruz@mail.com' } });
    expect((await p).ok).toBeTrue();
    expect(auth.currentUser()?.name).toBe('Ana Cruz');
  });

  it('updateProfile() rejects empty or invalid input without calling the API', async () => {
    expect((await auth.updateProfile('', 'a@b.co')).ok).toBeFalse();
    expect((await auth.updateProfile('Ana', 'nope')).ok).toBeFalse();
    http.expectNone(`${environment.apiUrl}/profile.php`);
  });

  it('changePassword() validates locally, then POSTs both passwords', async () => {
    expect((await auth.changePassword('', 'newpass1', 'newpass1')).ok).toBeFalse();
    expect((await auth.changePassword('secret1', '123', '123')).ok).toBeFalse();
    expect((await auth.changePassword('secret1', 'newpass1', 'newpass2')).ok).toBeFalse();
    http.expectNone(`${environment.apiUrl}/profile.php?action=password`);

    await signIn();
    const p = auth.changePassword('secret1', 'newpass1', 'newpass1');
    const req = http.expectOne(`${environment.apiUrl}/profile.php?action=password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ current_password: 'secret1', new_password: 'newpass1' });
    req.flush({ success: true, message: 'Password updated.' });
    expect((await p).ok).toBeTrue();
  });

  it('a wrong current password shows the message and keeps you signed in', async () => {
    await signIn();
    const p = auth.changePassword('wrong', 'newpass1', 'newpass1');
    http.expectOne(`${environment.apiUrl}/profile.php?action=password`).flush(
      { success: false, message: 'Your current password is incorrect.' },
      { status: 422, statusText: 'Unprocessable Entity' },
    );
    const result = await p;
    expect(result.ok).toBeFalse();
    if (!result.ok) expect(result.error).toContain('incorrect');
    expect(auth.isLoggedIn()).toBeTrue();
  });
});
