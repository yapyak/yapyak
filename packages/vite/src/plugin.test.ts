import type { ResolvedConfig } from 'vite';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { yapyak } from './plugin';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('yapyak vite plugin — build mode', () => {
  let root: string;
  let localePath: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'yapyak-vite-'));
    mkdirSync(join(root, 'src'), { recursive: true });
    mkdirSync(join(root, 'locales'), { recursive: true });
    writeFileSync(
      join(root, 'src', 'foo.tsx'),
      "import { t } from 'yapyak';\nexport const a = () => t('Hello');\nexport const b = () => t('World');\n",
    );
    localePath = join(root, 'locales', 'sv.json');
  });

  afterEach(() => {
    rmSync(root, { force: true, recursive: true });
  });

  it('preserves locale files during `vite build`', async () => {
    const existing = {
      'src/foo.tsx': {
        Hello: 'Hej',
        World: 'Världen',
      },
    };
    writeFileSync(localePath, JSON.stringify(existing, null, 2));
    const before = readFileSync(localePath, 'utf8');

    const plugin = yapyak();
    await invokeConfigResolved(plugin, root, 'build');
    invokeBuildStart(plugin);

    const after = readFileSync(localePath, 'utf8');
    expect(after).toBe(before);
  });

  it('writes no missing locale file during `vite build`', async () => {
    writeFileSync(join(root, 'locales', 'en.json'), '{}');

    const plugin = yapyak();
    await invokeConfigResolved(plugin, root, 'build');
    invokeBuildStart(plugin);

    expect(() => readFileSync(join(root, 'locales', 'sv.json'))).toThrow();
  });
});

async function invokeConfigResolved(
  plugin: ReturnType<typeof yapyak>,
  root: string,
  command: 'build' | 'serve',
): Promise<void> {
  const hook = plugin.configResolved;
  if (typeof hook !== 'function') {
    throw new Error('configResolved hook missing');
  }
  await (hook as (config: ResolvedConfig) => unknown).call(plugin, {
    command,
    root,
  } as ResolvedConfig);
}

function invokeBuildStart(plugin: ReturnType<typeof yapyak>): void {
  const hook = plugin.buildStart;
  if (typeof hook !== 'function') {
    throw new Error('buildStart hook missing');
  }
  (hook as () => void).call(plugin);
}
