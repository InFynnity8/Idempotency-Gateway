import { Module } from '@nestjs/common';
import { IdempotencyService } from './idempotency.service';
import { IdempotencyStore } from './idempotency.store';
import { AuditModule } from 'src/audit/audit.module';
import { MemoryIdempotencyStore } from './store/memory-idempotency.store';
import { RedisIdempotencyStore } from './store/redis-idempotency.store';

@Module({
  imports: [AuditModule],
  providers: [
    IdempotencyService,
    IdempotencyStore,
    RedisIdempotencyStore,
    MemoryIdempotencyStore,
  ],
  exports: [IdempotencyService],
})
export class IdempotencyModule {}
