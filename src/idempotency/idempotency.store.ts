import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class IdempotencyStore implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;

  async onModuleInit() {
    this.client = createClient({
      url: 'redis://localhost:6379',
    });

    await this.client.connect();
    console.log('Redis connected');
  }

  async onModuleDestroy() {
    await this.client.quit();
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
    if (!existing) return null;
    await this.client.set(key, JSON.stringify({ ...existing, ...data }));
  }
}
