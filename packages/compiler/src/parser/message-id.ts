import { createHash } from 'node:crypto';

const ID_LENGTH = 12;

export function toMessageId(source: string, context?: string): string {
  const input = context === undefined ? source : `${source} ${context}`;
  return createHash('sha256').update(input).digest('hex').slice(0, ID_LENGTH);
}
