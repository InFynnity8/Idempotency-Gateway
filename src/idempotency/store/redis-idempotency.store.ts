import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { IdempotencyStore } from '../../types/idempotency.store';

@Injectable()
export class RedisIdempotencyStore
  implements IdempotencyStore, OnModuleInit, OnModuleDestroy
{
  private client: RedisClientType | null = null;
  private enabled = false;

  async onModuleInit() {
    if (!process.env.REDIS_URL) {
      console.warn('[Redis] REDIS_URL not set — Redis store disabled');
      return;
    }

    this.client = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
      },
    });

    this.client.on('connect', () => console.log('[Redis] Connecting...'));

    this.client.on('ready', () => console.log('[Redis] Connected'));

    this.client.on('error', (err) => console.error('[Redis] Error:', err));

    await this.client.connect();
    this.enabled = true;
  }

  private ensureEnabled() {
    if (!this.enabled || !this.client) {
      throw new Error('Redis store is not enabled');
    }
  }

  async get(key: string): Promise<any | null> {
    this.ensureEnabled();

    const value = await this.client!.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, data: any, ttlSeconds: number): Promise<void> {
    this.ensureEnabled();

    await this.client!.set(
      key,
      JSON.stringify({
        ...data,
        createdAt: Date.now(),
      }),
      { EX: ttlSeconds },
    );
  }

  async update(key: string, data: any): Promise<void> {
    this.ensureEnabled();

    const ttl = await this.client!.ttl(key);
    if (ttl <= 0) return;

    const existing = await this.get(key);
    if (!existing) return;

    await this.client!.set(key, JSON.stringify({ ...existing, ...data }), {
      EX: ttl,
    });
  }

  async delete(key: string): Promise<void> {
    if (!this.enabled || !this.client) return;
    await this.client.del(key);
  }

  async onModuleDestroy() {
    if (this.client?.isOpen) {
      await this.client.quit();
      console.log('[Redis] Connection closed');
    }
  }
}
