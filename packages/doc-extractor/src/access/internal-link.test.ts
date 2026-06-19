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
                    type: 'text',
                    value: 'Settings',
                  },
                ],
                href: '/guide/settings',
                kind: 'internal',
                type: 'link',
              },
            ],
            type: 'paragraph',
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
                    type: 'text',
                    value: 'Hello',
                  },
                ],
                href: 'https://example.com',
                kind: 'external',
                type: 'link',
              },
            ],
            type: 'paragraph',
          },
        ]),
      ),
    ).toEqual([]);
  });
});
