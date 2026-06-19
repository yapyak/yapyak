import type { Block, SwitchBlock, TableBlock } from './block';

import { describe, expect, it } from 'vitest';

import { walkBlocks } from './block';

function collect(block: Block | Block[]): Block[] {
  const visited: Block[] = [];
  walkBlocks(block, (current) => visited.push(current));
  return visited;
}

const TEXT_HELLO: Block = {
  type: 'text',
  value: 'Hello',
};

const TEXT_WORLD: Block = {
  type: 'text',
  value: 'World',
};

describe('walkBlocks', () => {
  it('walks a single block', () => {
    expect(collect(TEXT_HELLO)).toEqual([
      TEXT_HELLO,
    ]);
  });

  it('walks every block in an array', () => {
    expect(
      collect([
        TEXT_HELLO,
        TEXT_WORLD,
      ]),
    ).toEqual([
      TEXT_HELLO,
      TEXT_WORLD,
    ]);
  });

  it('walks the `children` of a block', () => {
    const paragraph: Block = {
      children: [
        TEXT_HELLO,
      ],
      type: 'paragraph',
    };
    expect(collect(paragraph)).toEqual([
      paragraph,
      TEXT_HELLO,
    ]);
  });

  it('walks `head` and `body` of a `table`', () => {
    const head = {
      children: [
        {
          children: [
            TEXT_HELLO,
          ],
          header: true,
          type: 'table-cell' as const,
        },
      ],
      type: 'table-row' as const,
    };
    const bodyRow = {
      children: [
        {
          children: [
            TEXT_WORLD,
          ],
          header: false,
          type: 'table-cell' as const,
        },
      ],
      type: 'table-row' as const,
    };
    const table: TableBlock = {
      body: [
        bodyRow,
      ],
      head,
      type: 'table',
    };
    const visited = collect(table);

    expect(visited).toContain(head);
    expect(visited).toContain(bodyRow);
    expect(visited).toContain(TEXT_HELLO);
    expect(visited).toContain(TEXT_WORLD);
  });

  it('walks `body` only when `head` is `null`', () => {
    const bodyRow = {
      children: [
        {
          children: [
            TEXT_HELLO,
          ],
          header: false,
          type: 'table-cell' as const,
        },
      ],
      type: 'table-row' as const,
    };
    const table: TableBlock = {
      body: [
        bodyRow,
      ],
      head: null,
      type: 'table',
    };

    expect(collect(table)).toContain(bodyRow);
  });

  it('walks every branch of a `switch`', () => {
    const switchBlock: SwitchBlock = {
      branches: {
        react: [
          TEXT_HELLO,
        ],
        vue: [
          TEXT_WORLD,
        ],
      },
      group: 'framework',
      type: 'switch',
    };
    const visited = collect(switchBlock);

    expect(visited).toContain(TEXT_HELLO);
    expect(visited).toContain(TEXT_WORLD);
  });
});
