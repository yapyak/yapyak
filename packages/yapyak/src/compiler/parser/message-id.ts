import { toMessageKey } from './message-key';
import { createHash } from 'node:crypto';

export function toMessageId(source: string, context?: string): string {
  return createHash('sha256')
    .update(toMessageKey(source, context))
    .digest('hex')
    .slice(0, 12);
}
