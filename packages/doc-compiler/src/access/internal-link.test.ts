import type { Block } from './block';

import { describe, expect, it } from 'vitest';

import { getInternalLinks } from './internal-link';

function blocks(items: Block[]): Block[] {
  return items;
}

describe('getInternalLinks', () => {
  it('lists every internal link in the page', () => {
    expect(
      getInternalLinks(
        blocks([
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
      ),
    ).toEqual([
      {
        href: '/guide/settings',
        text: 'Settings',
      },
    ]);
  });

  it('returns no entry for an external link', () => {
    expect(
      getInternalLinks(
        blocks([
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
      ),
    ).toEqual([]);
  });
});
