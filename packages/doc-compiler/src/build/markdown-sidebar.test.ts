import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildMarkdownSidebar } from './markdown-sidebar';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let dir = '';

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'markdown-sidebar-'));
});

afterEach(() => {
  rmSync(dir, {
    force: true,
    recursive: true,
  });
});

describe('buildMarkdownSidebar', () => {
  it('lists every markdown file as a sidebar `link`', async () => {
    writeFileSync(join(dir, 'hello.md'), '---\ntitle: Hello\n---');
    writeFileSync(join(dir, 'world.md'), '---\ntitle: World\n---');

    const sidebar = await buildMarkdownSidebar(dir, 'guide');

    expect(sidebar).toEqual([
      {
        href: '/guide/hello',
        label: 'Hello',
        type: 'link',
      },
      {
        href: '/guide/world',
        label: 'World',
        type: 'link',
      },
    ]);
  });

  it('builds a `group` node from a nested directory', async () => {
    mkdirSync(join(dir, 'getting-started'));
    writeFileSync(
      join(dir, 'getting-started', 'index.md'),
      '---\ntitle: Getting started\n---',
    );
    writeFileSync(
      join(dir, 'getting-started', 'hello.md'),
      '---\ntitle: Hello\n---',
    );

    const sidebar = await buildMarkdownSidebar(dir, 'guide');

    expect(sidebar).toEqual([
      {
        children: [
          {
            href: '/guide/getting-started/hello',
            label: 'Hello',
            type: 'link',
          },
        ],
        collapsible: false,
        label: 'Getting started',
        type: 'group',
      },
    ]);
  });

  it('sorts entries by `frontmatter.order` when present', async () => {
    writeFileSync(join(dir, 'hello.md'), '---\ntitle: Hello\norder: 2\n---');
    writeFileSync(join(dir, 'world.md'), '---\ntitle: World\norder: 1\n---');

    const sidebar = await buildMarkdownSidebar(dir, 'guide');

    expect(sidebar.map((node) => node.label)).toEqual([
      'World',
      'Hello',
    ]);
  });

  it('skips a markdown file whose `frontmatter.redirect` is set', async () => {
    writeFileSync(join(dir, 'old.md'), '---\nredirect: /guide/settings\n---');
    writeFileSync(join(dir, 'hello.md'), '---\ntitle: Hello\n---');

    const sidebar = await buildMarkdownSidebar(dir, 'guide');

    expect(sidebar).toEqual([
      {
        href: '/guide/hello',
        label: 'Hello',
        type: 'link',
      },
    ]);
  });

  it('returns an empty list when the directory does not exist', async () => {
    expect(await buildMarkdownSidebar(join(dir, 'missing'), 'guide')).toEqual(
      [],
    );
  });
});
