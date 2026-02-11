import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { IdempotencyStore } from '../../types/idempotency.store';

@Injectable()
export class RedisIdempotencyStore
  implements IdempotencyStore, OnModuleInit, OnModuleDestroy
{
  private client: RedisClientType;

  async onModuleInit() {
    this.client = createClient({
      url: process.env.REDIS_URL ?? 'redis://localhost:6379',
    });
    if (
      process.env.NODE_ENV === 'production' ||
      process.env.USE_REDIS_STORE === 'true'
    ) {
      await this.client.connect();
      console.log('[Redis] Connected');
    }
  }

  async get(key: string) {
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, data: any, ttlSeconds: number) {
    await this.client.set(
      key,
      JSON.stringify({ ...data, createdAt: Date.now() }),
      { EX: ttlSeconds },
    );
  }

  async update(key: string, data: any) {
    const existing = await this.get(key);
    if (!existing) return;

    await this.client.set(key, JSON.stringify({ ...existing, ...data }));
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
