import { Injectable } from '@nestjs/common';
import { IdempotencyStore } from './idempotency.store';
import { hashPayload } from 'src/utils/hash';
import { AuditService } from 'src/audit/audit.service';

@Injectable()
export class IdempotencyService {
  constructor(
    private readonly store: IdempotencyStore,
    private readonly AuditService: AuditService,
  ) {}

  async checkOrCreate(key: string, payload: any, ttl = 60) {
    const requestHash = hashPayload(payload);
    const existing = await this.store.get(key);

    if (!existing) {
      this.store.set(
        key,
        {
          key,
          requestHash,
          status: 'IN_PROGRESS',
        },
        ttl,
      );
      this.AuditService.log('RECEIVED', { key, payload });
      return { status: 'NEW' };
    }
    if (existing.status === 'COMPLETED') {
      if (existing.requestHash !== requestHash) {
        this.AuditService.log('CONFLICT', { key, payload });
        return { status: 'CONFLICT' };
      }
      this.AuditService.log('REPLAYED', { key, payload });
      return { status: 'REPLAY', response: existing.response };
    }

    if (existing.requestHash !== requestHash) {
      this.AuditService.log('CONFLICT_IN_PROGRESS', { key, payload });
      return { status: 'CONFLICT' };
    }
    this.AuditService.log('PROCESSING_STARTED', { key, payload });
    return { status: 'IN_PROGRESS' };
  }

  async complete(key: string, response: any) {
    await this.store.update(key, {
      status: 'COMPLETED',
      response,
    });
    this.AuditService.log('COMPLETED', { key, response });
  }
}
