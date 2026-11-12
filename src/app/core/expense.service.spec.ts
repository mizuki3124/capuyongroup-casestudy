import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { ExpenseService } from './expense.service';
import { StorageService } from './storage.service';
import { MemoryStorage } from './testing';

describe('ExpenseService', () => {
  let service: ExpenseService;
  let http: HttpTestingController;
  const api = (path: string) => `${environment.apiUrl}/${path}`;
  const food = (cash: number) => ({ content: 'Lunch', descript: 'Rice meal', choice: 'Food', cash });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: StorageService, useClass: MemoryStorage },
      ],
    });
    service = TestBed.inject(ExpenseService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('list() GETs the expenses and turns numeric ids into strings', async () => {
    const p = service.list();
    const req = http.expectOne(api('expenses.php'));
    expect(req.request.method).toBe('GET');
    req.flush({
      success: true,
      data: [{ id: 7, content: 'Lunch', descript: 'Rice', choice: 'Food', cash: 85.5, date: '2026-11-11' }],
    });
    const list = await p;
    expect(list.length).toBe(1);
    expect(list[0].id).toBe('7');
    expect(list[0].cash).toBe(85.5);
  });

  it('list() returns an empty array when the server is unreachable', async () => {
    const p = service.list();
    http.expectOne(api('expenses.php')).error(new ProgressEvent('error'));
    expect(await p).toEqual([]);
  });

  it('getWallet() GETs the balance as a number', async () => {
    const p = service.getWallet();
    http.expectOne(api('wallet.php')).flush({ success: true, data: { wallet: 850 } });
    expect(await p).toBe(850);
  });

  it('add() POSTs the trimmed expense with today\'s date', async () => {
    const p = service.add({ ...food(150), content: '  Lunch  ' });
    const req = http.expectOne(api('expenses.php'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body.content).toBe('Lunch');
    expect(req.request.body.cash).toBe(150);
    expect(req.request.body.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    req.flush({ success: true, message: 'Expense created.' }, { status: 201, statusText: 'Created' });
    expect((await p).ok).toBeTrue();
  });

  it('add() rejects invalid input without calling the API', async () => {
    expect((await service.add(food(0))).ok).toBeFalse();
    expect((await service.add(food(-5))).ok).toBeFalse();
    expect((await service.add({ ...food(10), content: '  ' })).ok).toBeFalse();
    http.expectNone(api('expenses.php'));
  });

  it('add() shows the server message when the balance is too low', async () => {
    const p = service.add(food(1500));
    http.expectOne(api('expenses.php')).flush(
      { success: false, message: 'Insufficient balance! Your wallet: ₱1,000.00' },
      { status: 422, statusText: 'Unprocessable Entity' },
    );
    const result = await p;
    expect(result.ok).toBeFalse();
    if (!result.ok) expect(result.error).toContain('Insufficient balance');
  });

  it('update() PUTs the changes to ?id=', async () => {
    const p = service.update('7', { content: 'Dinner', descript: 'x', cash: 160 });
    const req = http.expectOne(api('expenses.php?id=7'));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ content: 'Dinner', descript: 'x', cash: 160 });
    req.flush({ success: true, message: 'Expense updated.' });
    expect((await p).ok).toBeTrue();
  });

  it('update() rejects an empty field without calling the API', async () => {
    expect((await service.update('7', { content: '', descript: 'x', cash: 10 })).ok).toBeFalse();
    http.expectNone(api('expenses.php?id=7'));
  });

  it('remove() sends DELETE ?id= and reports "not found"', async () => {
    const ok = service.remove('7');
    const req = http.expectOne(api('expenses.php?id=7'));
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, message: 'Expense deleted.' });
    expect((await ok).ok).toBeTrue();

    const missing = service.remove('99');
    http.expectOne(api('expenses.php?id=99')).flush(
      { success: false, message: 'Expense not found.' },
      { status: 404, statusText: 'Not Found' },
    );
    expect((await missing).ok).toBeFalse();
  });

  it('setWallet() PUTs the new balance and topUp() POSTs an amount', async () => {
    const set = service.setWallet(500);
    const putReq = http.expectOne(api('wallet.php'));
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body).toEqual({ amount: 500 });
    putReq.flush({ success: true });
    expect((await set).ok).toBeTrue();

    const top = service.topUp(100);
    const postReq = http.expectOne(api('wallet.php'));
    expect(postReq.request.method).toBe('POST');
    expect(postReq.request.body).toEqual({ amount: 100 });
    postReq.flush({ success: true });
    expect((await top).ok).toBeTrue();
  });

  it('wallet changes reject invalid amounts without calling the API', async () => {
    expect((await service.setWallet(-1)).ok).toBeFalse();
    expect((await service.setWallet(NaN)).ok).toBeFalse();
    expect((await service.topUp(0)).ok).toBeFalse();
    expect((await service.topUp(-10)).ok).toBeFalse();
    http.expectNone(api('wallet.php'));
  });

  it('list() gives every expense a photos array (empty when the server sends none)', async () => {
    const p = service.list();
    http.expectOne(api('expenses.php')).flush({
      success: true,
      data: [
        { id: 1, content: 'A', descript: 'a', choice: 'Food', cash: 10, date: '2026-11-11' },
        { id: 2, content: 'B', descript: 'b', choice: 'Food', cash: 20, date: '2026-11-11', photos: [{ id: 5, file: 'x.jpg' }] },
      ],
    });
    const list = await p;
    expect(list[0].photos).toEqual([]);
    expect(list[1].photos).toEqual([{ id: 5, file: 'x.jpg' }]);
  });

  it('add() hands back the saved expense so photos can be attached', async () => {
    const p = service.add(food(150));
    http.expectOne(api('expenses.php')).flush(
      { success: true, data: { id: 9, content: 'Lunch', descript: 'Rice meal', choice: 'Food', cash: 150, date: '2026-11-11' } },
      { status: 201, statusText: 'Created' },
    );
    const result = await p;
    expect(result.ok).toBeTrue();
    if (result.ok) expect(result.expense?.id).toBe('9');
  });

  it('restore() POSTs ?action=restore (Undo delete)', async () => {
    const p = service.restore('7');
    const req = http.expectOne(api('expenses.php?id=7&action=restore'));
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, message: 'Expense restored.' });
    expect((await p).ok).toBeTrue();
  });

  it('restore() reports when the balance can no longer cover the expense', async () => {
    const p = service.restore('7');
    http.expectOne(api('expenses.php?id=7&action=restore')).flush(
      { success: false, message: 'Not enough balance to undo.' },
      { status: 422, statusText: 'Unprocessable Entity' },
    );
    const result = await p;
    expect(result.ok).toBeFalse();
    if (!result.ok) expect(result.error).toContain('Not enough balance');
  });

  it('uploadPhoto() sends the picture as multipart form data, and deletePhoto() sends DELETE', async () => {
    const up = service.uploadPhoto('7', new Blob(['x'], { type: 'image/jpeg' }));
    const req = http.expectOne(api('photos.php?expense_id=7'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();
    expect(req.request.headers.has('Content-Type')).toBeFalse(); // the browser adds the multipart boundary
    req.flush({ success: true, data: { id: 3, file: 'abc.jpg' } }, { status: 201, statusText: 'Created' });
    const result = await up;
    expect(result.ok).toBeTrue();

    const del = service.deletePhoto(3);
    const delReq = http.expectOne(api('photos.php?id=3'));
    expect(delReq.request.method).toBe('DELETE');
    delReq.flush({ success: true });
    expect((await del).ok).toBeTrue();
  });
});
