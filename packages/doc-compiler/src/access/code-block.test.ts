import type { Page } from '../build';
import type { CodeBlock } from './block';

import { describe, expect, it } from 'vitest';

import { getCodeBlocks } from './code-block';

function page(blocks: Page['blocks']): Page {
  return {
    blocks,
    description: '',
    href: '/guide/settings',
    meta: {},
    title: 'Settings',
  };
}

const HELLO_CODE_BLOCK: CodeBlock = {
  label: null,
  language: 'ts',
  path: null,
  source: 'Hello',
  type: 'code-block',
};

const WORLD_CODE_BLOCK: CodeBlock = {
  label: null,
  language: 'ts',
  path: null,
  source: 'World',
  type: 'code-block',
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
                type: 'text',
                value: 'Hello',
              },
            ],
            type: 'paragraph',
          },
        ]),
      ),
    ).toEqual([]);
  });
});
