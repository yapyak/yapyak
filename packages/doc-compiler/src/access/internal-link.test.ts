import type { Page } from '../build';

import { describe, expect, it } from 'vitest';

import { getInternalLinks } from './internal-link';

function page(blocks: Page['blocks']): Page {
  return {
    blocks,
    description: '',
    href: '/guide/settings',
    meta: {},
    title: 'Settings',
  };
}

describe('getInternalLinks', () => {
  it('lists every internal link in the page', () => {
    expect(
      getInternalLinks(
        page([
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
        page([
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
