import { StorageService } from './storage.service';

/** In-memory replacement for StorageService, used by the unit tests. */
export class MemoryStorage extends StorageService {
  private data = new Map<string, string>();

  override get<T>(key: string, fallback: T): T {
    const raw = this.data.get(key);
    return raw === undefined ? fallback : (JSON.parse(raw) as T);
  }
  override set<T>(key: string, value: T): void {
    this.data.set(key, JSON.stringify(value));
  }
  override remove(key: string): void {
    this.data.delete(key);
  }
}
