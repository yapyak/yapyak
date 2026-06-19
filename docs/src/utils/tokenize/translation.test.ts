import { describe, expect, it } from 'vitest';

import { tokenizeTranslation } from './translation';

describe('tokenizeTranslation', () => {
  it('returns a `comment` prefix and `tx-source` content for a locale-prefixed line', () => {
    expect(tokenizeTranslation('sv: Hej')).toEqual([
      {
        type: 'comment',
        value: 'sv: ',
      },
      {
        type: 'tx-source',
        value: 'Hej',
      },
    ]);
  });

  it('returns a `tx-source` token for a line without a locale prefix', () => {
    expect(tokenizeTranslation('Hello')).toEqual([
      {
        type: 'tx-source',
        value: 'Hello',
      },
    ]);
  });

  it('preserves the trailing newline between lines as a `plain` token', () => {
    const result = tokenizeTranslation('Hello\nWorld');
    expect(result).toContainEqual({
      type: 'plain',
      value: '\n',
    });
  });
});
