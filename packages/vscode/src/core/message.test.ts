import { describe, expect, it } from 'vitest';
import { extractFile } from 'yapyak/compiler/internal';

import { findMessageAt } from './message';

const SOURCE = `import { t } from 'yapyak';

export const label = t('Save changes');
`;

describe('findMessageAt', () => {
  it('returns the message when found', () => {
    const { messages } = extractFile('src/a.tsx', SOURCE);
    const offset = SOURCE.indexOf("'Save changes'") + 1;

    expect(findMessageAt(messages, offset)?.message.source).toBe(
      'Save changes',
    );
  });

  it('returns undefined when not found', () => {
    const { messages } = extractFile('src/a.tsx', SOURCE);

    expect(findMessageAt(messages, 0)).toBeUndefined();
  });
});
