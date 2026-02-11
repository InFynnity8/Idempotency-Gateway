import { IdempotencyMiddleware } from './idempotency.middleware';

describe('IdempotencyMiddleware', () => {
  it('should be defined', () => {
    expect(new IdempotencyMiddleware()).toBeDefined();
  });
});
