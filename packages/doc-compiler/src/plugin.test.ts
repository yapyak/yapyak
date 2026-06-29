import type { Config } from './config';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { docCompiler } from './plugin';
import { EventEmitter } from 'node:events';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

type MockWatcher = EventEmitter & {
  add: (path: string) => void;
};

type MockServer = {
  config: {
    logger: {
      error: (message: string) => void;
    };
  };
  middlewares: {
    use: (handler: MiddlewareHandler) => void;
  };
  moduleGraph: {
    getModuleById: (id: string) => unknown;
    invalidateModule: (mod: unknown) => void;
  };
  watcher: MockWatcher;
  ws: {
    send: (message: unknown) => void;
  };
};

type MiddlewareHandler = (
  req: {
    url?: string;
  },
  res: MockResponse,
  next: () => void,
) => void;

type MockResponse = {
  end: (body?: string) => void;
  setHeader: (name: string, value: string) => void;
};

function createMockWatcher(): MockWatcher {
  const watcher = new EventEmitter() as MockWatcher;
  watcher.add = () => undefined;
  return watcher;
}

function createMockServer(): MockServer {
  return {
    config: {
      logger: {
        error: () => undefined,
      },
    },
    middlewares: {
      use: () => undefined,
    },
    moduleGraph: {
      getModuleById: () => undefined,
      invalidateModule: () => undefined,
    },
    watcher: createMockWatcher(),
    ws: {
      send: () => undefined,
    },
  };
}

function captureMiddleware(server: MockServer): {
  capturedHandlers: MiddlewareHandler[];
} {
  const capturedHandlers: MiddlewareHandler[] = [];
  server.middlewares.use = (handler) => {
    capturedHandlers.push(handler);
  };
  return {
    capturedHandlers,
  };
}

describe('docCompiler', () => {
  let root: string;
  let outPath: string;
  let markdownRoot: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'doc-compiler-'));
    markdownRoot = join(root, 'content');
    mkdirSync(markdownRoot, {
      recursive: true,
    });
    writeFileSync(
      join(markdownRoot, 'index.md'),
      '---\ntitle: Index\n---\nbody\n',
    );
    outPath = join(root, '.docs', 'manifest.json');
  });

  afterEach(() => {
    vi.useRealTimers();
    rmSync(root, {
      force: true,
      recursive: true,
    });
  });

  function configFor(): Config {
    return {
      collections: {
        guide: {
          root: markdownRoot,
          source: 'markdown',
        },
      },
      out: outPath,
    };
  }

  describe('buildStart', () => {
    it('writes the manifest file to `out`', async () => {
      const plugin = docCompiler(configFor());
      await (plugin.buildStart as () => Promise<void>).call({
        emitFile: () => undefined,
      });
      expect(existsSync(outPath)).toBe(true);
      const manifest = JSON.parse(readFileSync(outPath, 'utf8'));
      expect(manifest).toHaveProperty('collections');
    });
  });

  describe('configureServer', () => {
    it('emits a rebuild when a watched markdown file changes', async () => {
      vi.useFakeTimers();
      const plugin = docCompiler(configFor());
      const server = createMockServer();
      await (plugin.buildStart as () => Promise<void>).call({
        emitFile: () => undefined,
      });
      (plugin.configureServer as (server: MockServer) => void)(server);

      const newFile = join(markdownRoot, 'guide.md');
      writeFileSync(newFile, '---\ntitle: Guide\n---\nbody\n');
      server.watcher.emit('change', newFile);
      await vi.advanceTimersByTimeAsync(220);

      expect(existsSync(outPath)).toBe(true);
    });

    it('blocks a rebuild when a sibling-prefix directory file changes', async () => {
      vi.useFakeTimers();
      const siblingRoot = `${markdownRoot}-extra`;
      mkdirSync(siblingRoot, {
        recursive: true,
      });
      const plugin = docCompiler(configFor());
      const server = createMockServer();
      let invalidationAttempted = false;
      server.moduleGraph.getModuleById = () => {
        invalidationAttempted = true;
        return undefined;
      };
      await (plugin.buildStart as () => Promise<void>).call({
        emitFile: () => undefined,
      });
      (plugin.configureServer as (server: MockServer) => void)(server);

      const siblingFile = join(siblingRoot, 'a.md');
      writeFileSync(siblingFile, 'body');
      server.watcher.emit('change', siblingFile);
      await vi.advanceTimersByTimeAsync(220);

      expect(invalidationAttempted).toBe(false);
    });

    it('writes the agent artifact body when middleware receives a known `.md` path', async () => {
      const plugin = docCompiler({
        ...configFor(),
        agentArtifact: {
          description: 'agent docs',
          instructions: 'follow the guide',
          outDir: '.agents',
          siteName: 'docs',
          siteUrl: 'https://example.com',
        },
      });
      const server = createMockServer();
      const { capturedHandlers } = captureMiddleware(server);
      await (plugin.buildStart as () => Promise<void>).call({
        emitFile: () => undefined,
      });
      (plugin.configureServer as (server: MockServer) => void)(server);

      const handler = capturedHandlers[0];
      expect(handler).toBeDefined();
      const headers: Record<string, string> = {};
      let body: string | undefined;
      let nextCalled = false;
      await new Promise<void>((done) => {
        handler?.(
          {
            url: '/llms.txt',
          },
          {
            end: (b?: string) => {
              body = b;
              done();
            },
            setHeader: (name, value) => {
              headers[name] = value;
            },
          },
          () => {
            nextCalled = true;
            done();
          },
        );
      });
      if (nextCalled) {
        expect(body).toBeUndefined();
      } else {
        expect(headers['Content-Type']).toContain('text/markdown');
        expect(body).toBeTypeOf('string');
      }
    });

    it('blocks a non-markdown path when middleware receives it', async () => {
      const plugin = docCompiler({
        ...configFor(),
        agentArtifact: {
          description: 'agent docs',
          instructions: 'follow the guide',
          outDir: '.agents',
          siteName: 'docs',
          siteUrl: 'https://example.com',
        },
      });
      const server = createMockServer();
      const { capturedHandlers } = captureMiddleware(server);
      await (plugin.buildStart as () => Promise<void>).call({
        emitFile: () => undefined,
      });
      (plugin.configureServer as (server: MockServer) => void)(server);

      const handler = capturedHandlers[0];
      let nextCalled = false;
      handler?.(
        {
          url: '/index.html',
        },
        {
          end: () => undefined,
          setHeader: () => undefined,
        },
        () => {
          nextCalled = true;
        },
      );
      expect(nextCalled).toBe(true);
    });
  });

  describe('load', () => {
    it('returns module source code when given the resolved virtual id', () => {
      const plugin = docCompiler(configFor());
      const result = (plugin.load as (id: string) => string | undefined)(
        '\0virtual:doc-compiler',
      );
      expect(result).toContain('export const doc');
    });

    it('returns `undefined` for any other id', () => {
      const plugin = docCompiler(configFor());
      const result = (plugin.load as (id: string) => string | undefined)(
        'some-other-id',
      );
      expect(result).toBeUndefined();
    });
  });

  describe('resolveId', () => {
    it('returns the resolved virtual id when given `virtual:doc-compiler`', () => {
      const plugin = docCompiler(configFor());
      const result = (plugin.resolveId as (id: string) => string | undefined)(
        'virtual:doc-compiler',
      );
      expect(result).toBe('\0virtual:doc-compiler');
    });

    it('returns `undefined` for any other id', () => {
      const plugin = docCompiler(configFor());
      const result = (plugin.resolveId as (id: string) => string | undefined)(
        'some-other-id',
      );
      expect(result).toBeUndefined();
    });
  });
});
