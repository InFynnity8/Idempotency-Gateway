import { Module } from '@nestjs/common';
import { IdempotencyService } from './idempotency.service';
import { IdempotencyStore } from './idempotency.store';
import { AuditModule } from 'src/audit/audit.module';

@Module({
  imports: [AuditModule],
  providers: [IdempotencyService, IdempotencyStore],
  exports: [IdempotencyService],
})
export class IdempotencyModule {}
