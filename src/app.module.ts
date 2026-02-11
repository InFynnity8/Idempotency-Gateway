import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentModule } from './payment/payment.module';
import { IdempotencyModule } from './idempotency/idempotency.module';
import { IdempotencyMiddleware } from './idempotency/idempotency.middleware';
import { IdempotencyStore } from './idempotency/idempotency.store';
import { AuditModule } from './audit/audit.module';
import { MemoryIdempotencyStore } from './idempotency/store/memory-idempotency.store';
import { RedisIdempotencyStore } from './idempotency/store/redis-idempotency.store';

@Module({
  imports: [PaymentModule, IdempotencyModule, AuditModule],
  controllers: [AppController],
  providers: [
    AppService,
    IdempotencyStore,
    RedisIdempotencyStore,
    MemoryIdempotencyStore,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(IdempotencyMiddleware).forRoutes('/process-payment');
  }
}
