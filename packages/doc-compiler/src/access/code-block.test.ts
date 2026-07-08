import type { Page } from '../build';
import type { CodeBlock } from './block';

import { describe, expect, it } from 'vitest';

import { getCodeBlocks } from './code-block';

function page(blocks: Page['blocks']): Page {
  return {
    blocks,
    breadcrumbs: [],
    description: '',
    href: '/guide/settings',
    meta: {},
    title: 'Settings',
  };
}

const HELLO_CODE_BLOCK: CodeBlock = {
  kind: 'code-block',
  label: null,
  language: 'ts',
  path: null,
  source: 'Hello',
};

const WORLD_CODE_BLOCK: CodeBlock = {
  kind: 'code-block',
  label: null,
  language: 'ts',
  path: null,
  source: 'World',
};

describe('getCodeBlocks', () => {
  it('lists every `code-block` at the top level', () => {
    expect(
      getCodeBlocks(
        page([
          HELLO_CODE_BLOCK,
          WORLD_CODE_BLOCK,
        ]),
      ),
    ).toEqual([
      HELLO_CODE_BLOCK,
      WORLD_CODE_BLOCK,
    ]);
  });

  it('returns an empty list when no `code-block` is present', () => {
    expect(
      getCodeBlocks(
        page([
          {
            children: [
              {
                kind: 'text',
                value: 'Hello',
              },
            ],
            kind: 'paragraph',
          },
        ]),
      ),
    ).toEqual([]);
  });
});
