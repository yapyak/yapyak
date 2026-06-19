import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { extractMarkdown } from './extract';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let dir = '';

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'extract-markdown-'));
});

afterEach(() => {
  rmSync(dir, {
    force: true,
    recursive: true,
  });
});

describe('extractMarkdown', () => {
  it('extracts every markdown file under the root as a page', async () => {
    writeFileSync(join(dir, 'settings.md'), '---\ntitle: Settings\n---\nHello');

    const result = await extractMarkdown(dir, 'guide');

    const page = result.pages.get('settings');
    expect(page?.href).toBe('/guide/settings');
    expect(page?.title).toBe('Settings');
  });

  it('walks every nested directory for markdown files', async () => {
    mkdirSync(join(dir, 'getting-started'));
    writeFileSync(join(dir, 'getting-started', 'hello.md'), '# Hello');

    const result = await extractMarkdown(dir, 'guide');

    expect(result.pages.has('getting-started/hello')).toBe(true);
  });

  it('parses `frontmatter.redirect` into a `redirect` entry', async () => {
    writeFileSync(join(dir, 'old.md'), '---\nredirect: /guide/settings\n---\n');

    const result = await extractMarkdown(dir, 'guide');

    expect(result.redirects.get('old')).toBe('/guide/settings');
    expect(result.pages.has('old')).toBe(false);
  });

  it('resolves a relative link to an absolute href', async () => {
    mkdirSync(join(dir, 'guide'));
    writeFileSync(join(dir, 'guide', 'hello.md'), '[World](./world)');

    const result = await extractMarkdown(dir, 'guide');
    const page = result.pages.get('guide/hello');
    const [paragraph] = page?.blocks ?? [];

    expect(paragraph).toEqual({
      children: [
        {
          children: [
            {
              type: 'text',
              value: 'World',
            },
          ],
          href: '/guide/guide/world',
          kind: 'internal',
          type: 'link',
        },
      ],
      type: 'paragraph',
    });
  });

  it('lists every markdown file in the `watchedFiles`', async () => {
    writeFileSync(join(dir, 'hello.md'), '# Hello');
    writeFileSync(join(dir, 'world.md'), '# World');

    const result = await extractMarkdown(dir, 'guide');

    expect(result.watchedFiles).toHaveLength(2);
  });
});
