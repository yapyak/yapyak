import type { ResolvedConfig } from 'vite';
import type { TransformFileResult } from 'yapyak/compiler';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { yapyak } from './plugin';
import { EventEmitter } from 'node:events';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

type SourceMap = TransformFileResult['map'];

describe('yapyak', () => {
  let root: string;
  let localePath: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'yapyak-vite-'));
    mkdirSync(join(root, 'src'), { recursive: true });
    mkdirSync(join(root, 'locales'), { recursive: true });
    localePath = join(root, 'locales', 'sv.json');
  });

  afterEach(() => {
    vi.useRealTimers();
    rmSync(root, { force: true, recursive: true });
  });

  describe('build mode', () => {
    beforeEach(() => {
      writeFileSync(
        join(root, 'src', 'a.tsx'),
        "import { t } from 'yapyak';\nexport const a = () => t('Hello');\nexport const b = () => t('World');\n",
      );
    });

    it('preserves locale files when running `vite build`', async () => {
      const existing = {
        'src/a.tsx': {
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

    it('writes no missing locale file when running `vite build`', async () => {
      writeFileSync(join(root, 'locales', 'en.json'), '{}');

      const plugin = yapyak();
      await invokeConfigResolved(plugin, root, 'build');
      invokeBuildStart(plugin);

      expect(() => readFileSync(join(root, 'locales', 'sv.json'))).toThrow();
    });
  });

  describe('dev mode', () => {
    it('writes locale entry when adding a file with `t()` calls', async () => {
      writeFileSync(localePath, '{}');
      const plugin = yapyak();
      await invokeConfigResolved(plugin, root, 'serve');
      invokeBuildStart(plugin);

      vi.useFakeTimers();
      const server = createMockServer(createMockWatcher());
      invokeConfigureServer(plugin, server);
      const watcher = server.watcher;

      const newFile = join(root, 'src', 'b.tsx');
      writeFileSync(
        newFile,
        "import { t } from 'yapyak';\nexport const x = () => t('Hello');\n",
      );
      watcher.emit('add', newFile);
      await vi.advanceTimersByTimeAsync(60);

      const after = JSON.parse(readFileSync(localePath, 'utf8'));
      expect(after['src/b.tsx']).toEqual({ Hello: '' });
    });

    it('clears locale entries when removing a file', async () => {
      writeFileSync(
        join(root, 'src', 'a.tsx'),
        "import { t } from 'yapyak';\nexport const x = () => t('Hello');\n",
      );
      writeFileSync(
        join(root, 'src', 'b.tsx'),
        "import { t } from 'yapyak';\nexport const y = () => t('World');\n",
      );
      writeFileSync(
        localePath,
        JSON.stringify({
          'src/a.tsx': { Hello: 'Hej' },
          'src/b.tsx': { World: 'Världen' },
        }),
      );
      const plugin = yapyak();
      await invokeConfigResolved(plugin, root, 'serve');
      invokeBuildStart(plugin);

      vi.useFakeTimers();
      const server = createMockServer(createMockWatcher());
      invokeConfigureServer(plugin, server);
      const watcher = server.watcher;

      rmSync(join(root, 'src', 'a.tsx'));
      watcher.emit('unlink', join(root, 'src', 'a.tsx'));
      await vi.advanceTimersByTimeAsync(60);

      const after = JSON.parse(readFileSync(localePath, 'utf8'));
      expect(after['src/a.tsx']).toBeUndefined();
      expect(after['src/b.tsx']).toEqual({ World: 'Världen' });
    });

    it('syncs once for many simultaneous add events', async () => {
      writeFileSync(localePath, '{}');
      const plugin = yapyak();
      await invokeConfigResolved(plugin, root, 'serve');
      invokeBuildStart(plugin);

      vi.useFakeTimers();
      const server = createMockServer(createMockWatcher());
      invokeConfigureServer(plugin, server);
      const watcher = server.watcher;

      for (let index = 0; index < 5; index++) {
        const filePath = join(root, 'src', `f${index}.tsx`);
        writeFileSync(
          filePath,
          `import { t } from 'yapyak';\nexport const x = () => t('M${index}');\n`,
        );
        watcher.emit('add', filePath);
      }

      const mid = JSON.parse(readFileSync(localePath, 'utf8'));
      expect(
        Object.keys(mid).filter((k) => k.startsWith('src/f')),
      ).toHaveLength(0);

      await vi.advanceTimersByTimeAsync(60);

      const after = JSON.parse(readFileSync(localePath, 'utf8'));
      const newFileIds = Object.keys(after).filter((k) =>
        k.startsWith('src/f'),
      );
      expect(newFileIds).toHaveLength(5);
    });

    it('notifies the client when adding a locale file', async () => {
      const plugin = yapyak();
      await invokeConfigResolved(plugin, root, 'serve');
      invokeBuildStart(plugin);

      vi.useFakeTimers();
      const send = vi.fn();
      const server = createMockServer(createMockWatcher());
      server.ws.send = send;
      invokeConfigureServer(plugin, server);
      const watcher = server.watcher;

      const newLocale = join(root, 'locales', 'fr.json');
      writeFileSync(newLocale, '{}');
      watcher.emit('add', newLocale);
      await vi.advanceTimersByTimeAsync(60);

      expect(send).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ locale: 'fr' }),
          event: 'yapyak:locale-added',
          type: 'custom',
        }),
      );
    });

    it('notifies the client when removing a locale file', async () => {
      writeFileSync(join(root, 'locales', 'fr.json'), '{}');
      const plugin = yapyak();
      await invokeConfigResolved(plugin, root, 'serve');
      invokeBuildStart(plugin);

      vi.useFakeTimers();
      const send = vi.fn();
      const server = createMockServer(createMockWatcher());
      server.ws.send = send;
      invokeConfigureServer(plugin, server);
      const watcher = server.watcher;

      const removed = join(root, 'locales', 'fr.json');
      rmSync(removed);
      watcher.emit('unlink', removed);
      await vi.advanceTimersByTimeAsync(60);

      expect(send).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { locale: 'fr' },
          event: 'yapyak:locale-removed',
          type: 'custom',
        }),
      );
    });

    it('blocks notification for non-`.json` files in the locales directory', async () => {
      const plugin = yapyak();
      await invokeConfigResolved(plugin, root, 'serve');
      invokeBuildStart(plugin);

      vi.useFakeTimers();
      const send = vi.fn();
      const server = createMockServer(createMockWatcher());
      server.ws.send = send;
      invokeConfigureServer(plugin, server);
      const watcher = server.watcher;

      const readme = join(root, 'locales', 'README.md');
      writeFileSync(readme, '# Locales');
      watcher.emit('add', readme);
      await vi.advanceTimersByTimeAsync(60);

      expect(send).not.toHaveBeenCalled();
    });

    it('writes empty stubs without translating when adding a locale file', async () => {
      writeFileSync(
        join(root, 'src', 'a.tsx'),
        "import { t } from 'yapyak';\nexport const x = () => t('Hello');\n",
      );
      const plugin = yapyak();
      await invokeConfigResolved(plugin, root, 'serve');
      invokeBuildStart(plugin);

      vi.useFakeTimers();
      const server = createMockServer(createMockWatcher());
      invokeConfigureServer(plugin, server);
      const watcher = server.watcher;

      const newLocale = join(root, 'locales', 'fr.json');
      writeFileSync(newLocale, '{}');
      watcher.emit('add', newLocale);
      await vi.advanceTimersByTimeAsync(60);

      const after = JSON.parse(readFileSync(newLocale, 'utf8'));
      expect(after).toEqual({ 'src/a.tsx': { Hello: '' } });
    });

    it('notifies candidate modules when editing a locale file', async () => {
      writeFileSync(localePath, '{}');
      const plugin = yapyak();
      await invokeConfigResolved(plugin, root, 'serve');
      invokeBuildStart(plugin);

      vi.useFakeTimers();
      const reloadModule = vi.fn(() => Promise.resolve());
      const sourcePath = join(root, 'src', 'a.tsx');
      const server = createMockServer(createMockWatcher());
      server.reloadModule = reloadModule;
      server.moduleGraph.idToModuleMap.set('m1', {
        file: sourcePath,
        url: '/src/foo.tsx',
      });
      invokeConfigureServer(plugin, server);
      const watcher = server.watcher;

      writeFileSync(
        localePath,
        JSON.stringify({ 'src/a.tsx': { Hello: 'Hej' } }),
      );
      watcher.emit('change', localePath);
      await vi.advanceTimersByTimeAsync(60);

      expect(reloadModule).toHaveBeenCalledTimes(1);
    });

    it('blocks reload for non-locale files', async () => {
      const plugin = yapyak();
      await invokeConfigResolved(plugin, root, 'serve');
      invokeBuildStart(plugin);

      vi.useFakeTimers();
      const reloadModule = vi.fn(() => Promise.resolve());
      const sourcePath = join(root, 'src', 'a.tsx');
      const server = createMockServer(createMockWatcher());
      server.reloadModule = reloadModule;
      server.moduleGraph.idToModuleMap.set('m1', {
        file: sourcePath,
        url: '/src/foo.tsx',
      });
      invokeConfigureServer(plugin, server);
      const watcher = server.watcher;

      const otherPath = join(root, 'src', 'a.tsx');
      writeFileSync(otherPath, 'x');
      watcher.emit('change', otherPath);
      await vi.advanceTimersByTimeAsync(60);

      expect(reloadModule).not.toHaveBeenCalled();
    });

    it('blocks reload for non-candidate modules in the graph', async () => {
      writeFileSync(localePath, '{}');
      const plugin = yapyak();
      await invokeConfigResolved(plugin, root, 'serve');
      invokeBuildStart(plugin);

      vi.useFakeTimers();
      const reloadModule = vi.fn(() => Promise.resolve());
      const server = createMockServer(createMockWatcher());
      server.reloadModule = reloadModule;
      server.moduleGraph.idToModuleMap.set('m1', {
        file: join(root, 'src', 'styles.css'),
        url: '/src/styles.css',
      });
      invokeConfigureServer(plugin, server);
      const watcher = server.watcher;

      watcher.emit('change', localePath);
      await vi.advanceTimersByTimeAsync(60);

      expect(reloadModule).not.toHaveBeenCalled();
    });

    it('blocks notification for nested locale paths', async () => {
      mkdirSync(join(root, 'locales', 'sub'), { recursive: true });
      const plugin = yapyak();
      await invokeConfigResolved(plugin, root, 'serve');
      invokeBuildStart(plugin);

      vi.useFakeTimers();
      const send = vi.fn();
      const server = createMockServer(createMockWatcher());
      server.ws.send = send;
      invokeConfigureServer(plugin, server);
      const watcher = server.watcher;

      const nested = join(root, 'locales', 'sub', 'fr.json');
      writeFileSync(nested, '{}');
      watcher.emit('add', nested);
      await vi.advanceTimersByTimeAsync(60);

      expect(send).not.toHaveBeenCalled();
    });

    it('clears pending timers on `buildEnd`', async () => {
      writeFileSync(localePath, '{}');
      const plugin = yapyak();
      await invokeConfigResolved(plugin, root, 'serve');
      invokeBuildStart(plugin);
      const before = readFileSync(localePath, 'utf8');

      vi.useFakeTimers();
      const server = createMockServer(createMockWatcher());
      invokeConfigureServer(plugin, server);
      const watcher = server.watcher;

      const newSource = join(root, 'src', 'b.tsx');
      writeFileSync(
        newSource,
        "import { t } from 'yapyak';\nexport const x = () => t('Hello');\n",
      );
      watcher.emit('add', newSource);

      invokeBuildEnd(plugin);
      await vi.advanceTimersByTimeAsync(60);

      const after = readFileSync(localePath, 'utf8');
      expect(after).toBe(before);
    });
  });

  describe('auto-translate threshold', () => {
    function writeConfig(opts: { threshold?: number }): void {
      const thresholdLine =
        opts.threshold === undefined
          ? ''
          : `  autoTranslateThreshold: ${opts.threshold},`;
      const config = [
        "const map = { Hello: 'Hej', World: 'Världen', Save: 'Spara' };",
        'const translator = Object.assign(',
        '  async (req) => map[req.source] ?? req.source,',
        '  {',
        "    id: 'test',",
        '    async batch(reqs) {',
        '      return reqs.map((r) => map[r.source] ?? r.source);',
        '    },',
        '  },',
        ');',
        'export default {',
        thresholdLine,
        '  translator,',
        '};',
      ].join('\n');
      writeFileSync(join(root, 'yapyak.config.ts'), config);
    }

    it('writes translations when new strings stay under the threshold', async () => {
      writeFileSync(localePath, '{}');
      writeConfig({});
      const plugin = yapyak();
      await invokeConfigResolved(plugin, root, 'serve');
      invokeBuildStart(plugin);

      const server = createMockServer(createMockWatcher());
      invokeConfigureServer(plugin, server);

      const newFile = join(root, 'src', 'a.tsx');
      writeFileSync(
        newFile,
        "import { t } from 'yapyak';\nexport const x = () => t('Hello');\n",
      );
      server.watcher.emit('add', newFile);

      await vi.waitFor(
        () => {
          const localeJson = JSON.parse(readFileSync(localePath, 'utf8'));
          expect(localeJson['src/a.tsx']?.Hello).toBe('Hej');
        },
        { interval: 20, timeout: 2000 },
      );
    });

    it('blocks auto-translate when new strings exceed the threshold', async () => {
      writeFileSync(localePath, '{}');
      writeConfig({ threshold: 1 });
      const plugin = yapyak();
      await invokeConfigResolved(plugin, root, 'serve');
      invokeBuildStart(plugin);

      const server = createMockServer(createMockWatcher());
      invokeConfigureServer(plugin, server);

      const newFile = join(root, 'src', 'a.tsx');
      writeFileSync(
        newFile,
        "import { t } from 'yapyak';\nexport const a = () => t('Hello');\nexport const b = () => t('World');\n",
      );
      server.watcher.emit('add', newFile);

      await vi.waitFor(
        () => {
          const localeJson = JSON.parse(readFileSync(localePath, 'utf8'));
          expect(localeJson['src/a.tsx']).toBeDefined();
        },
        { interval: 20, timeout: 2000 },
      );
      await new Promise((resolve) => setTimeout(resolve, 100));

      const localeJson = JSON.parse(readFileSync(localePath, 'utf8'));
      expect(localeJson['src/a.tsx']).toEqual({ Hello: '', World: '' });
    });

    it('blocks auto-translate when the threshold is `0`', async () => {
      writeFileSync(localePath, '{}');
      writeConfig({ threshold: 0 });
      const plugin = yapyak();
      await invokeConfigResolved(plugin, root, 'serve');
      invokeBuildStart(plugin);

      const server = createMockServer(createMockWatcher());
      invokeConfigureServer(plugin, server);

      const newFile = join(root, 'src', 'a.tsx');
      writeFileSync(
        newFile,
        "import { t } from 'yapyak';\nexport const x = () => t('Hello');\n",
      );
      server.watcher.emit('add', newFile);

      await vi.waitFor(
        () => {
          const localeJson = JSON.parse(readFileSync(localePath, 'utf8'));
          expect(localeJson['src/a.tsx']).toBeDefined();
        },
        { interval: 20, timeout: 2000 },
      );
      await new Promise((resolve) => setTimeout(resolve, 100));

      const localeJson = JSON.parse(readFileSync(localePath, 'utf8'));
      expect(localeJson['src/a.tsx']).toEqual({ Hello: '' });
    });
  });

  describe('fixedLocale', () => {
    beforeEach(() => {
      writeFileSync(
        join(root, 'src', 'a.tsx'),
        "import { t } from 'yapyak';\nexport const a = () => t('Hello');\n",
      );
      writeFileSync(
        join(root, 'locales', 'sv.json'),
        JSON.stringify({ 'src/a.tsx': { Hello: 'Hej' } }),
      );
      writeFileSync(join(root, 'locales', 'en.json'), '{}');
    });

    it('accepts a fixedLocale that exists in the project', async () => {
      const plugin = yapyak({ fixedLocale: 'sv' });
      await expect(
        invokeConfigResolved(plugin, root, 'build'),
      ).resolves.toBeUndefined();
    });

    it('throws when fixedLocale is not in the project locales', async () => {
      const plugin = yapyak({ fixedLocale: 'fr' });
      await expect(invokeConfigResolved(plugin, root, 'build')).rejects.toThrow(
        /fixedLocale 'fr' is not configured/,
      );
    });

    it('treats empty string as no fixedLocale', async () => {
      const plugin = yapyak({ fixedLocale: '' });
      await expect(
        invokeConfigResolved(plugin, root, 'build'),
      ).resolves.toBeUndefined();
    });

    it('treats undefined as no fixedLocale (default behavior)', async () => {
      const plugin = yapyak({});
      await expect(
        invokeConfigResolved(plugin, root, 'build'),
      ).resolves.toBeUndefined();
    });

    it('rewrites `t()` to the locale literal when fixedLocale is set', async () => {
      const plugin = yapyak({ fixedLocale: 'sv' });
      await invokeConfigResolved(plugin, root, 'build');
      const output = await invokeTransform(plugin, join(root, 'src', 'a.tsx'));
      expect(output).toContain('Hej');
      expect(output).not.toContain('_pick');
    });

    it('leaves `_pick` in place when fixedLocale is not set', async () => {
      const plugin = yapyak();
      await invokeConfigResolved(plugin, root, 'build');
      const output = await invokeTransform(plugin, join(root, 'src', 'a.tsx'));
      expect(output).toContain('_pick');
    });
  });

  describe('sourcemap', () => {
    beforeEach(() => {
      writeFileSync(
        join(root, 'src', 'a.tsx'),
        "import { t } from 'yapyak';\nexport const a = () => t('Hello');\n",
      );
      writeFileSync(localePath, '{}');
    });

    it('emits sources as the absolute file path', async () => {
      const plugin = yapyak();
      await invokeConfigResolved(plugin, root, 'build');
      const filePath = join(root, 'src', 'a.tsx');
      const map = await invokeTransformMap(plugin, filePath);
      expect(map?.sources).toEqual([filePath]);
    });
  });

  describe('context disambiguation', () => {
    it('emits the context-disambiguated translation when source uses `t.as()`', async () => {
      writeFileSync(
        join(root, 'src', 'a.tsx'),
        "import { t } from 'yapyak';\nexport const x = t.as('button', 'Save');\n",
      );
      writeFileSync(
        localePath,
        JSON.stringify({ 'src/a.tsx': { 'Save@button': 'Lagra' } }),
      );

      const plugin = yapyak();
      await invokeConfigResolved(plugin, root, 'build');
      const output = await invokeTransform(plugin, join(root, 'src', 'a.tsx'));

      expect(output).toContain('Lagra');
    });

    it('emits the plain translation when source has no context', async () => {
      writeFileSync(
        join(root, 'src', 'a.tsx'),
        "import { t } from 'yapyak';\nexport const x = t('Save');\n",
      );
      writeFileSync(
        localePath,
        JSON.stringify({ 'src/a.tsx': { Save: 'Spara' } }),
      );

      const plugin = yapyak();
      await invokeConfigResolved(plugin, root, 'build');
      const output = await invokeTransform(plugin, join(root, 'src', 'a.tsx'));

      expect(output).toContain('Spara');
    });

    it('emits the source verbatim when the context key is missing from the catalog', async () => {
      writeFileSync(
        join(root, 'src', 'a.tsx'),
        "import { t } from 'yapyak';\nexport const x = t.as('button', 'Save');\n",
      );
      writeFileSync(
        localePath,
        JSON.stringify({ 'src/a.tsx': { Save: 'Spara' } }),
      );

      const plugin = yapyak();
      await invokeConfigResolved(plugin, root, 'build');
      const output = await invokeTransform(plugin, join(root, 'src', 'a.tsx'));

      expect(output).not.toContain('Spara');
    });
  });

  describe('plugin hooks', () => {
    it('builds a `config` with `yapyak/runtime` excluded from `optimizeDeps`', () => {
      const plugin = yapyak();
      const result = invokeConfig(plugin);
      expect(result.optimizeDeps?.exclude).toContain('yapyak/runtime');
    });

    it('builds a `config` with `yapyak/runtime` kept in SSR no-external', () => {
      const plugin = yapyak();
      const result = invokeConfig(plugin);
      expect(result.ssr?.noExternal).toBeDefined();
    });

    it('resolves `yapyak/runtime` to the virtual id', () => {
      const plugin = yapyak();
      expect(invokeResolveId(plugin, 'yapyak/runtime')).toBe(' yapyak:runtime');
    });

    it('returns `null` for `resolveId` on an unrelated module', () => {
      const plugin = yapyak();
      expect(invokeResolveId(plugin, 'react')).toBeNull();
    });

    it('loads the resolved runtime virtual id with HMR listener', async () => {
      const plugin = yapyak();
      await invokeConfigResolved(plugin, root, 'serve');
      const result = invokeLoad(plugin, ' yapyak:runtime');
      expect(result).toContain('export const');
      expect(result).toContain('yapyak:locale-added');
    });

    it('returns `null` for `load` on an unrelated id', async () => {
      const plugin = yapyak();
      await invokeConfigResolved(plugin, root, 'serve');
      expect(invokeLoad(plugin, '/some/other/id.ts')).toBeNull();
    });

    it('returns `null` for `transform` on a non-candidate file', async () => {
      const plugin = yapyak();
      await invokeConfigResolved(plugin, root, 'build');
      const result = await invokeTransformRaw(
        plugin,
        ' virtual-module',
        'export const x = 1;',
      );
      expect(result).toBeNull();
    });

    it('returns `null` for `transform` when source has no `t()` calls', async () => {
      writeFileSync(join(root, 'src', 'plain.tsx'), 'export const x = 1;\n');
      const plugin = yapyak();
      await invokeConfigResolved(plugin, root, 'build');
      const filePath = join(root, 'src', 'plain.tsx');
      const result = await invokeTransformRaw(
        plugin,
        filePath,
        readFileSync(filePath, 'utf8'),
      );
      expect(result).toBeNull();
    });

    it('clears teardown callbacks on `buildEnd`', () => {
      const plugin = yapyak();
      expect(() => invokeBuildEnd(plugin)).not.toThrow();
    });

    it('skips an initial scan in build mode on `buildStart`', async () => {
      writeFileSync(
        join(root, 'src', 'a.tsx'),
        "import { t } from 'yapyak';\nexport const x = t('Hello');\n",
      );
      writeFileSync(localePath, '{}');
      const plugin = yapyak();
      await invokeConfigResolved(plugin, root, 'build');
      invokeBuildStart(plugin);
      const sv = JSON.parse(readFileSync(localePath, 'utf8'));
      expect(sv['src/a.tsx']).toBeUndefined();
    });

    it('warns when `ssr.external` is set to `true`', async () => {
      const warnings: string[] = [];
      const logger = createSilentLogger();
      logger.warn = (message: string) => {
        warnings.push(message);
      };
      const plugin = yapyak();
      const hook = plugin.configResolved;
      if (typeof hook !== 'function') throw new Error('missing');
      await (hook as (config: ResolvedConfig) => unknown).call(plugin, {
        command: 'serve',
        logger,
        root,
        ssr: { external: true },
      } as unknown as ResolvedConfig);
      expect(
        warnings.some((line) => line.includes('config.ssr.external')),
      ).toBe(true);
    });

    it('warns when `ssr.external` is set to a function', async () => {
      const warnings: string[] = [];
      const logger = createSilentLogger();
      logger.warn = (message: string) => {
        warnings.push(message);
      };
      const plugin = yapyak();
      const hook = plugin.configResolved;
      if (typeof hook !== 'function') throw new Error('missing');
      await (hook as (config: ResolvedConfig) => unknown).call(plugin, {
        command: 'serve',
        logger,
        root,
        ssr: { external: () => false },
      } as unknown as ResolvedConfig);
      expect(warnings.some((line) => line.includes('a function'))).toBe(true);
    });

    it('filters yapyak entries out of an `ssr.external` array', async () => {
      const external = ['react', 'yapyak', '@yapyak/react', 'lodash'];
      const plugin = yapyak();
      const hook = plugin.configResolved;
      if (typeof hook !== 'function') throw new Error('missing');
      await (hook as (config: ResolvedConfig) => unknown).call(plugin, {
        command: 'serve',
        logger: createSilentLogger(),
        root,
        ssr: { external },
      } as unknown as ResolvedConfig);
      expect(external).toEqual(['react', 'lodash']);
    });

    it('throws when `fixedLocale` is not in the discovered locales', async () => {
      writeFileSync(join(root, 'locales', 'en.json'), '{}');
      const plugin = yapyak({ fixedLocale: 'de' });
      const hook = plugin.configResolved;
      if (typeof hook !== 'function') throw new Error('missing');
      await expect(
        (hook as (config: ResolvedConfig) => unknown).call(plugin, {
          command: 'build',
          logger: createSilentLogger(),
          root,
        } as ResolvedConfig),
      ).rejects.toThrow(/fixedLocale 'de' is not configured/);
    });
  });

  describe('handleHotUpdate', () => {
    it('returns early when the changed file is not a candidate', async () => {
      writeFileSync(localePath, '{}');
      const plugin = yapyak();
      await invokeConfigResolved(plugin, root, 'serve');
      invokeBuildStart(plugin);
      const before = readFileSync(localePath, 'utf8');
      await invokeHandleHotUpdate(plugin, join(root, 'src', 'static.css'), 'x');
      const after = readFileSync(localePath, 'utf8');
      expect(after).toBe(before);
    });

    it('returns early when the messages are unchanged', async () => {
      const filePath = join(root, 'src', 'a.tsx');
      const source =
        "import { t } from 'yapyak';\nexport const x = t('Hello');\n";
      writeFileSync(filePath, source);
      writeFileSync(localePath, '{}');
      const plugin = yapyak();
      await invokeConfigResolved(plugin, root, 'serve');
      invokeBuildStart(plugin);
      const before = readFileSync(localePath, 'utf8');
      await invokeHandleHotUpdate(plugin, filePath, source);
      const after = readFileSync(localePath, 'utf8');
      expect(after).toBe(before);
    });

    it('deletes the file entry when the changed file no longer has `t()` calls', async () => {
      const filePath = join(root, 'src', 'a.tsx');
      writeFileSync(
        filePath,
        "import { t } from 'yapyak';\nexport const x = t('Hello');\n",
      );
      writeFileSync(localePath, '{}');
      const plugin = yapyak();
      await invokeConfigResolved(plugin, root, 'serve');
      invokeBuildStart(plugin);
      await invokeHandleHotUpdate(
        plugin,
        filePath,
        "export const x = 'static';\n",
      );
      const sv = JSON.parse(readFileSync(localePath, 'utf8'));
      expect(sv['src/a.tsx']).toBeUndefined();
    });

    it('rewrites the file entry when the messages change', async () => {
      const filePath = join(root, 'src', 'a.tsx');
      writeFileSync(
        filePath,
        "import { t } from 'yapyak';\nexport const x = t('Hello');\n",
      );
      writeFileSync(localePath, '{}');
      const plugin = yapyak();
      await invokeConfigResolved(plugin, root, 'serve');
      invokeBuildStart(plugin);
      await invokeHandleHotUpdate(
        plugin,
        filePath,
        "import { t } from 'yapyak';\nexport const x = t('World');\n",
      );
      const sv = JSON.parse(readFileSync(localePath, 'utf8'));
      expect(sv['src/a.tsx']).toEqual({ World: '' });
    });
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
    logger: createSilentLogger(),
    root,
  } as ResolvedConfig);
}

function createSilentLogger(): ResolvedConfig['logger'] {
  const noop = (): void => undefined;
  return {
    clearScreen: noop,
    error: noop,
    hasErrorLogged: () => false,
    hasWarned: false,
    info: noop,
    warn: noop,
    warnOnce: noop,
  };
}

type TransformHook = (
  code: string,
  id: string,
) =>
  | { code: string; map?: SourceMap }
  | null
  | Promise<{ code: string; map?: SourceMap } | null>;

async function invokeTransform(
  plugin: ReturnType<typeof yapyak>,
  filePath: string,
): Promise<string> {
  const hook = plugin.transform;
  if (typeof hook !== 'function') {
    throw new Error('transform hook missing');
  }
  const code = readFileSync(filePath, 'utf8');
  const result = await (hook as TransformHook).call(plugin, code, filePath);
  return result?.code ?? code;
}

async function invokeTransformMap(
  plugin: ReturnType<typeof yapyak>,
  filePath: string,
): Promise<SourceMap | undefined> {
  const hook = plugin.transform;
  if (typeof hook !== 'function') {
    throw new Error('transform hook missing');
  }
  const code = readFileSync(filePath, 'utf8');
  const result = await (hook as TransformHook).call(plugin, code, filePath);
  return result?.map;
}

function invokeBuildStart(plugin: ReturnType<typeof yapyak>): void {
  const hook = plugin.buildStart;
  if (typeof hook !== 'function') {
    throw new Error('buildStart hook missing');
  }
  (hook as () => void).call(plugin);
}

function invokeConfig(plugin: ReturnType<typeof yapyak>): {
  optimizeDeps?: { exclude?: string[] };
  ssr?: { noExternal?: unknown };
} {
  const hook = plugin.config;
  if (typeof hook !== 'function') {
    throw new Error('config hook missing');
  }
  return (
    hook as () => {
      optimizeDeps?: { exclude?: string[] };
      ssr?: { noExternal?: unknown };
    }
  ).call(plugin);
}

function invokeResolveId(
  plugin: ReturnType<typeof yapyak>,
  id: string,
): string | null {
  const hook = plugin.resolveId;
  if (typeof hook !== 'function') {
    throw new Error('resolveId hook missing');
  }
  return (hook as (id: string) => string | null).call(plugin, id);
}

function invokeLoad(
  plugin: ReturnType<typeof yapyak>,
  id: string,
): string | null {
  const hook = plugin.load;
  if (typeof hook !== 'function') {
    throw new Error('load hook missing');
  }
  return (hook as (id: string) => string | null).call(plugin, id);
}

async function invokeTransformRaw(
  plugin: ReturnType<typeof yapyak>,
  filePath: string,
  code: string,
): Promise<{ code: string; map?: SourceMap } | null> {
  const hook = plugin.transform;
  if (typeof hook !== 'function') {
    throw new Error('transform hook missing');
  }
  return (await (hook as TransformHook).call(plugin, code, filePath)) ?? null;
}

function invokeBuildEnd(plugin: ReturnType<typeof yapyak>): void {
  const hook = plugin.buildEnd;
  if (typeof hook !== 'function') {
    throw new Error('buildEnd hook missing');
  }
  (hook as () => void).call(plugin);
}

async function invokeHandleHotUpdate(
  plugin: ReturnType<typeof yapyak>,
  file: string,
  code: string,
): Promise<void> {
  const hook = plugin.handleHotUpdate;
  if (typeof hook !== 'function') {
    throw new Error('handleHotUpdate hook missing');
  }
  await (
    hook as (ctx: {
      file: string;
      read: () => Promise<string>;
    }) => Promise<void>
  ).call(plugin, {
    file,
    read: () => Promise.resolve(code),
  });
}

interface MockWatcher extends EventEmitter {
  add(path: string): void;
}

interface MockModule {
  file: string | null;
  url: string;
}

interface MockMessage {
  data: Record<string, unknown>;
  event: string;
  type: string;
}

interface MockServer {
  moduleGraph: {
    getModuleById: (id: string) => MockModule | undefined;
    idToModuleMap: Map<unknown, MockModule>;
  };
  reloadModule: (mod: unknown) => Promise<void>;
  restart: () => Promise<void>;
  watcher: MockWatcher;
  ws: { send: (message: MockMessage) => void };
}

function createMockWatcher(): MockWatcher {
  const emitter = new EventEmitter() as MockWatcher;
  emitter.add = () => {};
  return emitter;
}

function createMockServer(watcher: MockWatcher): MockServer {
  const idToModuleMap = new Map<unknown, MockModule>();
  return {
    moduleGraph: {
      getModuleById: (id: string) => idToModuleMap.get(id),
      idToModuleMap,
    },
    reloadModule: () => Promise.resolve(),
    restart: () => Promise.resolve(),
    watcher,
    ws: { send: () => {} },
  };
}

function invokeConfigureServer(
  plugin: ReturnType<typeof yapyak>,
  server: MockServer,
): void {
  const hook = plugin.configureServer;
  if (typeof hook !== 'function') {
    throw new Error('configureServer hook missing');
  }
  (hook as (server: unknown) => void).call(plugin, server);
}
