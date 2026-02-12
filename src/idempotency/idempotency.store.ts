import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { RedisIdempotencyStore } from './store/redis-idempotency.store';
import { MemoryIdempotencyStore } from './store/memory-idempotency.store';

@Injectable()
export class IdempotencyStore implements OnModuleInit, OnModuleDestroy {
  private store: RedisIdempotencyStore | MemoryIdempotencyStore;

  constructor(
    private readonly redisStore: RedisIdempotencyStore,
    private readonly memoryStore: MemoryIdempotencyStore,
  ) {}

  async onModuleInit() {
    const useMemory =
      process.env.NODE_ENV !== 'production' ||
      process.env.USE_IN_MEMORY_STORE === 'true';

    this.store = useMemory ? this.memoryStore : this.redisStore;

    if ('onModuleInit' in this.store) {
      await this.store.onModuleInit?.();
    }

    console.log(
      `[IdempotencyStore] Using ${
        useMemory ? 'In-Memory Store' : 'Redis Store'
      }`,
    );
  }

  async onModuleDestroy() {
    if ('onModuleDestroy' in this.store) {
      await this.store.onModuleDestroy?.();
    }
  }

  get(key: string) {
    return this.store.get(key);
  }

  async set(key: string, data: any, ttlSeconds: number) {
    return this.store.set(key, data, ttlSeconds);
  }

  async update(key: string, data: any) {
    return this.store.update(key, data);
  }
}
