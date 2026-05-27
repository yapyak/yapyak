import { createHash } from 'node:crypto';

export function toMessageId(source: string, context?: string): string {
  const data = context === undefined ? source : `${source} ${context}`;
  return createHash('sha256').update(data).digest('hex').slice(0, 12);
}
