import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { IdempotencyStore } from '../../types/idempotency.store';

type Entry = {
  data: any;
  expiresAt: number;
};

@Injectable()
export class MemoryIdempotencyStore
  implements IdempotencyStore, OnModuleDestroy
{
  private store = new Map<string, Entry>();
  private cleanup: NodeJS.Timeout;

  constructor() {
    this.cleanup = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.store.entries()) {
        if (value.expiresAt <= now) {
          this.store.delete(key);
        }
      }
    }, 30_000);
  }

  get(key: string) {
    const entry = this.store.get(key);
    if (!entry || entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  async set(key: string, data: any, ttlSeconds: number) {
    this.store.set(key, {
      data: { ...data, createdAt: Date.now() },
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async update(key: string, data: any) {
    const existing = await this.get(key);
    if (!existing) return;

    this.store.set(key, {
      data: { ...existing, ...data },
      expiresAt: Date.now() + 60_000,
    });
  }

  onModuleDestroy() {
    clearInterval(this.cleanup);
  }
}
