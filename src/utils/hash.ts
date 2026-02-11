import { createHash } from "crypto";

export function hashPayload(payload: any): string {
  return createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex');
}
