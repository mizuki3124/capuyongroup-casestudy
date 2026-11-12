import { ExpenseService } from './expense.service';
import { PhotoItem, PhotoRef, MAX_PHOTOS } from './models';
import { PickedPhoto } from './photo.service';

/**
 * The pictures of an expense while the user is still editing it. Adding and removing only changes this draft;
 * nothing is sent to the server until `commit()` runs (when the user presses Save).
 */
export class PhotoDraft {
  items: PhotoItem[];

  private blobs = new Map<string, Blob>();
  private removedIds: number[] = [];
  private counter = 0;

  constructor(existing: PhotoRef[] = []) {
    this.items = existing.map((p) => ({ key: `p${p.id}`, file: p.file, photoId: p.id }));
  }

  get isFull(): boolean {
    return this.items.length >= MAX_PHOTOS;
  }

  addNew(picked: PickedPhoto): void {
    if (this.isFull) return;
    const key = `n${++this.counter}`;
    this.blobs.set(key, picked.blob);
    this.items = [...this.items, { key, src: picked.preview }];
  }

  remove(item: PhotoItem): void {
    if (item.photoId !== undefined) this.removedIds.push(item.photoId);
    this.blobs.delete(item.key);
    this.items = this.items.filter((i) => i.key !== item.key);
  }

  /**
   * Deletes the removed pictures and uploads the new ones, one at a time (each new tile shows "Uploading").
   * Returns how many of those steps failed.
   */
  async commit(expenseId: string, expenses: ExpenseService): Promise<number> {
    let failed = 0;

    for (const id of this.removedIds) {
      if (!(await expenses.deletePhoto(id)).ok) failed++;
    }
    this.removedIds = [];

    for (const item of this.items) {
      const blob = this.blobs.get(item.key);
      if (!blob) continue; // already on the server

      this.mark(item.key, true);
      const res = await expenses.uploadPhoto(expenseId, blob);
      this.mark(item.key, false);

      if (res.ok) {
        this.blobs.delete(item.key); // do not upload it twice if the user retries
        this.items = this.items.map((i) =>
          i.key === item.key ? { key: i.key, file: res.photo.file, photoId: res.photo.id } : i,
        );
      } else {
        failed++;
      }
    }
    return failed;
  }

  private mark(key: string, uploading: boolean): void {
    this.items = this.items.map((i) => (i.key === key ? { ...i, uploading } : i));
  }
}
