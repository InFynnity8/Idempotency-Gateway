export interface IdempotencyStore {
  get(key: string): Promise<any | null>;
  set(key: string, data: any, ttlSeconds: number): Promise<void>;
  update(key: string, data: any): Promise<void>;
}
