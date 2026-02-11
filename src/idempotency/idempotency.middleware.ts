import { Injectable, NestMiddleware } from '@nestjs/common';
import { IdempotencyService } from './idempotency.service';
import { IdempotencyStore } from './idempotency.store';
import { AuditService } from 'src/audit/audit.service';

@Injectable()
export class IdempotencyMiddleware implements NestMiddleware {
  constructor(
    private readonly IdempotencyService: IdempotencyService,
    private readonly store: IdempotencyStore,
    private readonly AuditService: AuditService,
  ) {}

  async use(req: any, res: any, next: () => void) {
    const key = req.headers['idempotency-key'];
    if (!key) {
      this.AuditService.log('NO KEY', {});
      return res.status(409).json({
          error: 'Idempotency key missing from header.',
        });;
    }

    const result = await this.IdempotencyService.checkOrCreate(
      key,
      req.body,
      60,
    );

    switch (result.status) {
      case 'NEW':
        return next();

      case 'REPLAY':
        res.setHeader('X-Cache-Hit', 'true');
        return res.status(200).json(result.response);

      case 'CONFLICT':
        return res.status(409).json({
          error: 'Idempotency key already used for a different request body.',
        });

      case 'IN_PROGRESS':
        this.AuditService.log('RECEIVED', { key, result });
        let attempts = 0;
        const interval = 100;
        while (attempts < 50) {
          const updated = await this.store.get(key);
          if (updated.status === 'COMPLETED') {
            res.setHeaders('X-Cache-Hit', 'true');
            this.AuditService.log('COMPLETED', { key, updated });
            return res.status(200).json(updated.response);
          }
          await new Promise((_) => setTimeout(_, interval));
          attempts++;
        }
        return res
          .status(503)
          .json({ error: 'Request still in progress, try again' });
    }
  }
}
