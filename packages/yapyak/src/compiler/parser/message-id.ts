import { createHash } from 'node:crypto';

export function toMessageId(source: string, context?: string): string {
  const hashInput = context === undefined ? source : `${source} ${context}`;
  return createHash('sha256').update(hashInput).digest('hex').slice(0, 12);
}
