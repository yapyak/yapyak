import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildSupplement } from './supplement';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let dir = '';

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'supplement-'));
});

afterEach(() => {
  rmSync(dir, {
    force: true,
    recursive: true,
  });
});

describe('buildSupplement', () => {
  it('builds a `group` node whose label matches the supplement label', async () => {
    writeFileSync(join(dir, 'YAP0001.md'), '---\ntitle: Hello\n---');

    const { sidebarNode } = await buildSupplement({
      collectionName: 'reference',
      supplement: {
        label: 'Diagnostics',
        root: dir,
        slug: 'diagnostics',
      },
    });

    expect(sidebarNode.label).toBe('Diagnostics');
    expect(sidebarNode.kind).toBe('group');
  });

  it('builds a child `link` per markdown file under the supplement root', async () => {
    writeFileSync(join(dir, 'YAP0001.md'), '---\ntitle: Hello\n---');
    writeFileSync(join(dir, 'YAP0007.md'), '---\ntitle: World\n---');

    const { sidebarNode } = await buildSupplement({
      collectionName: 'reference',
      supplement: {
        label: 'Diagnostics',
        root: dir,
        slug: 'diagnostics',
      },
    });

    expect(sidebarNode.children).toEqual([
      {
        href: '/reference/diagnostics/YAP0001',
        kind: 'link',
        label: 'Hello',
      },
      {
        href: '/reference/diagnostics/YAP0007',
        kind: 'link',
        label: 'World',
      },
    ]);
  });

  it('returns the file slug as label when frontmatter `title` is missing', async () => {
    writeFileSync(join(dir, 'YAP0001.md'), 'Hello');

    const { sidebarNode } = await buildSupplement({
      collectionName: 'reference',
      supplement: {
        label: 'Diagnostics',
        root: dir,
        slug: 'diagnostics',
      },
    });

    expect(sidebarNode.children[0]).toEqual({
      href: '/reference/diagnostics/YAP0001',
      kind: 'link',
      label: 'YAP0001',
    });
  });

  it('writes the group `href` to the index page when `index.md` exists', async () => {
    writeFileSync(join(dir, 'index.md'), '---\ntitle: Overview\n---');
    writeFileSync(join(dir, 'YAP0001.md'), '---\ntitle: Hello\n---');

    const { sidebarNode } = await buildSupplement({
      collectionName: 'reference',
      supplement: {
        label: 'Diagnostics',
        root: dir,
        slug: 'diagnostics',
      },
    });

    expect(sidebarNode.href).toBe('/reference/diagnostics');
  });

  it('returns no group `href` when `index.md` is absent', async () => {
    writeFileSync(join(dir, 'YAP0001.md'), '---\ntitle: Hello\n---');

    const { sidebarNode } = await buildSupplement({
      collectionName: 'reference',
      supplement: {
        label: 'Diagnostics',
        root: dir,
        slug: 'diagnostics',
      },
    });

    expect(sidebarNode.href).toBeUndefined();
  });

  it('lists every page under the supplement path prefix', async () => {
    writeFileSync(join(dir, 'YAP0001.md'), '---\ntitle: Hello\n---');

    const { pages } = await buildSupplement({
      collectionName: 'reference',
      supplement: {
        label: 'Diagnostics',
        root: dir,
        slug: 'diagnostics',
      },
    });

    expect(pages.get('diagnostics/YAP0001')?.href).toBe(
      '/reference/diagnostics/YAP0001',
    );
  });

  // biome-ignore lint/suspicious/noTemplateCurlyInString: yap yap yap
  it('registers every entry under `symbols` keyed by `${supplement.slug}/${slug}`', async () => {
    writeFileSync(join(dir, 'YAP0001.md'), '---\ntitle: Hello\n---');

    const { symbols } = await buildSupplement({
      collectionName: 'reference',
      supplement: {
        label: 'Diagnostics',
        root: dir,
        slug: 'diagnostics',
      },
    });

    expect(symbols['diagnostics/YAP0001']).toEqual({
      collection: 'reference',
      path: 'diagnostics/YAP0001',
    });
  });

  it('returns `defaultOpen` only when the supplement is collapsible', async () => {
    writeFileSync(join(dir, 'YAP0001.md'), '---\ntitle: Hello\n---');

    const { sidebarNode } = await buildSupplement({
      collectionName: 'reference',
      supplement: {
        collapsible: true,
        expanded: true,
        label: 'Diagnostics',
        root: dir,
        slug: 'diagnostics',
      },
    });

    expect(sidebarNode.collapsible).toBe(true);
    expect(sidebarNode.defaultOpen).toBe(true);
  });

  it('sorts children by frontmatter `order` before falling back to slug', async () => {
    writeFileSync(join(dir, 'YAP0001.md'), '---\ntitle: A\norder: 2\n---');
    writeFileSync(join(dir, 'YAP0007.md'), '---\ntitle: B\norder: 1\n---');

    const { sidebarNode } = await buildSupplement({
      collectionName: 'reference',
      supplement: {
        label: 'Diagnostics',
        root: dir,
        slug: 'diagnostics',
      },
    });

    expect(sidebarNode.children.map((child) => child.label)).toEqual([
      'B',
      'A',
    ]);
  });
});
