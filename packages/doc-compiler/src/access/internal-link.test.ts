import { describe, expect, it } from 'vitest';

import { getInternalLinks } from './internal-link';

describe('getInternalLinks', () => {
  it('lists every internal link in the page', () => {
    expect(
      getInternalLinks([
        {
          children: [
            {
              children: [
                {
                  kind: 'text',
                  value: 'Settings',
                },
              ],
              href: '/guide/settings',
              kind: 'link',
              linkKind: 'internal',
            },
          ],
          kind: 'paragraph',
        },
      ]),
    ).toEqual([
      {
        href: '/guide/settings',
        text: 'Settings',
      },
    ]);
  });

  it('returns no entry for an external link', () => {
    expect(
      getInternalLinks([
        {
          children: [
            {
              children: [
                {
                  kind: 'text',
                  value: 'Hello',
                },
              ],
              href: 'https://example.com',
              kind: 'link',
              linkKind: 'external',
            },
          ],
          kind: 'paragraph',
        },
      ]),
    ).toEqual([]);
  });
});
