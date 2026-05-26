import type { ResolvedConfig } from 'vite';

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
        join(root, 'src', 'foo.tsx'),
        "import { t } from 'yapyak';\nexport const a = () => t('Hello');\nexport const b = () => t('World');\n",
      );
    });

    it('preserves locale files when running `vite build`', async () => {
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

      const newFile = join(root, 'src', 'new.tsx');
      writeFileSync(
        newFile,
        "import { t } from 'yapyak';\nexport const x = () => t('Hello');\n",
      );
      watcher.emit('add', newFile);
      await vi.advanceTimersByTimeAsync(60);

      const after = JSON.parse(readFileSync(localePath, 'utf8'));
      expect(after['src/new.tsx']).toEqual({ Hello: '' });
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

      for (let i = 0; i < 5; i++) {
        const f = join(root, 'src', `f${i}.tsx`);
        writeFileSync(
          f,
          `import { t } from 'yapyak';\nexport const x = () => t('M${i}');\n`,
        );
        watcher.emit('add', f);
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
        join(root, 'src', 'foo.tsx'),
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
      expect(after).toEqual({ 'src/foo.tsx': { Hello: '' } });
    });

    it('reloads candidate modules when editing a locale file', async () => {
      writeFileSync(localePath, '{}');
      const plugin = yapyak();
      await invokeConfigResolved(plugin, root, 'serve');
      invokeBuildStart(plugin);

      vi.useFakeTimers();
      const reloadModule = vi.fn(() => Promise.resolve());
      const sourcePath = join(root, 'src', 'foo.tsx');
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
        JSON.stringify({ 'src/foo.tsx': { Hello: 'Hej' } }),
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
      const sourcePath = join(root, 'src', 'foo.tsx');
      const server = createMockServer(createMockWatcher());
      server.reloadModule = reloadModule;
      server.moduleGraph.idToModuleMap.set('m1', {
        file: sourcePath,
        url: '/src/foo.tsx',
      });
      invokeConfigureServer(plugin, server);
      const watcher = server.watcher;

      const otherPath = join(root, 'src', 'foo.tsx');
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

      const newSource = join(root, 'src', 'new.tsx');
      writeFileSync(
        newSource,
        "import { t } from 'yapyak';\nexport const x = () => t('Welcome');\n",
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

      const newFile = join(root, 'src', 'foo.tsx');
      writeFileSync(
        newFile,
        "import { t } from 'yapyak';\nexport const x = () => t('Hello');\n",
      );
      server.watcher.emit('add', newFile);

      await vi.waitFor(
        () => {
          const data = JSON.parse(readFileSync(localePath, 'utf8'));
          expect(data['src/foo.tsx']?.Hello).toBe('Hej');
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

      const newFile = join(root, 'src', 'foo.tsx');
      writeFileSync(
        newFile,
        "import { t } from 'yapyak';\nexport const a = () => t('Hello');\nexport const b = () => t('World');\n",
      );
      server.watcher.emit('add', newFile);

      await vi.waitFor(
        () => {
          const data = JSON.parse(readFileSync(localePath, 'utf8'));
          expect(data['src/foo.tsx']).toBeDefined();
        },
        { interval: 20, timeout: 2000 },
      );
      await new Promise((resolve) => setTimeout(resolve, 100));

      const data = JSON.parse(readFileSync(localePath, 'utf8'));
      expect(data['src/foo.tsx']).toEqual({ Hello: '', World: '' });
    });

    it('blocks auto-translate when the threshold is `0`', async () => {
      writeFileSync(localePath, '{}');
      writeConfig({ threshold: 0 });
      const plugin = yapyak();
      await invokeConfigResolved(plugin, root, 'serve');
      invokeBuildStart(plugin);

      const server = createMockServer(createMockWatcher());
      invokeConfigureServer(plugin, server);

      const newFile = join(root, 'src', 'foo.tsx');
      writeFileSync(
        newFile,
        "import { t } from 'yapyak';\nexport const x = () => t('Hello');\n",
      );
      server.watcher.emit('add', newFile);

      await vi.waitFor(
        () => {
          const data = JSON.parse(readFileSync(localePath, 'utf8'));
          expect(data['src/foo.tsx']).toBeDefined();
        },
        { interval: 20, timeout: 2000 },
      );
      await new Promise((resolve) => setTimeout(resolve, 100));

      const data = JSON.parse(readFileSync(localePath, 'utf8'));
      expect(data['src/foo.tsx']).toEqual({ Hello: '' });
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

function invokeBuildEnd(plugin: ReturnType<typeof yapyak>): void {
  const hook = plugin.buildEnd;
  if (typeof hook !== 'function') {
    throw new Error('buildEnd hook missing');
  }
  (hook as () => void).call(plugin);
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
