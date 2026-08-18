import { describe, expect, it } from 'vitest';

import { collectUntranslatedEntries } from './untranslated-entry';

describe('collectUntranslatedEntries', () => {
  it('collects the entry whose translation is empty', () => {
    const text = JSON.stringify(
      {
        'src/a.tsx': {
          Cancel: '',
          Hello: 'Hej',
        },
      },
      null,
      2,
    );
    const entries = collectUntranslatedEntries(text);

    expect(entries).toHaveLength(1);
    expect(entries[0]?.source).toBe('Cancel');
  });

  it('collects the entry whose translation holds only spaces', () => {
    const text = '{"src/a.tsx":{"Cancel":"   "}}';

    expect(collectUntranslatedEntries(text)).toHaveLength(1);
  });

  it('collects the context variant whose translation is empty', () => {
    const text = JSON.stringify(
      {
        'src/a.tsx': {
          Open: {
            badge: '',
            button: 'Öppna',
          },
        },
      },
      null,
      2,
    );
    const entries = collectUntranslatedEntries(text);

    expect(entries).toHaveLength(1);
    expect(entries[0]?.context).toBe('badge');
  });

  it('collects no entry when every translation holds text', () => {
    const text = JSON.stringify({
      'src/a.tsx': {
        Hello: 'Hej',
        Save: 'Spara',
      },
    });

    expect(collectUntranslatedEntries(text)).toEqual([]);
  });
});
