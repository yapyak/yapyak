import type { Config } from './config';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { docCompiler } from './plugin';
import { EventEmitter } from 'node:events';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
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
    idToModuleMap: Map<
      string,
      {
        id: string | null;
      }
    >;
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
      idToModuleMap: new Map(),
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
  let markdownRoot: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'docs-compiler-'));
    markdownRoot = join(root, 'content');
    mkdirSync(markdownRoot, {
      recursive: true,
    });
    writeFileSync(
      join(markdownRoot, 'index.md'),
      '---\ntitle: Index\n---\nbody\n',
    );
  });

  afterEach(() => {
    rmSync(root, {
      force: true,
      recursive: true,
    });
  });

  function configFor(): Config {
    return {
      collections: {
        guide: {
          kind: 'markdown',
          root: markdownRoot,
        },
      },
    };
  }

  async function startPlugin(plugin: ReturnType<typeof docCompiler>) {
    await (plugin.buildStart as () => Promise<void>).call({
      emitFile: () => undefined,
    });
  }

  describe('configureServer', () => {
    it('emits a rebuild when a watched markdown file changes', async () => {
      const plugin = docCompiler(configFor());
      const server = createMockServer();
      let reloaded = false;
      server.ws.send = () => {
        reloaded = true;
      };
      await startPlugin(plugin);
      (plugin.configureServer as (server: MockServer) => void)(server);

      const newFile = join(markdownRoot, 'guide.md');
      writeFileSync(newFile, '---\ntitle: Guide\n---\nbody\n');
      server.watcher.emit('change', newFile);

      await vi.waitFor(() => {
        expect(reloaded).toBe(true);
      });
    });

    it('blocks a rebuild when a sibling-prefix directory file changes', async () => {
      const siblingRoot = `${markdownRoot}-extra`;
      mkdirSync(siblingRoot, {
        recursive: true,
      });
      const plugin = docCompiler(configFor());
      const server = createMockServer();
      let reloaded = false;
      server.ws.send = () => {
        reloaded = true;
      };
      await startPlugin(plugin);
      (plugin.configureServer as (server: MockServer) => void)(server);

      const siblingFile = join(siblingRoot, 'a.md');
      writeFileSync(siblingFile, 'body');
      server.watcher.emit('change', siblingFile);
      await new Promise((resolve) => {
        setTimeout(resolve, 300);
      });

      expect(reloaded).toBe(false);
    });

    it('sends the agent artifact body when middleware receives a known `.md` path', async () => {
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
      await startPlugin(plugin);
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
      await startPlugin(plugin);
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
    it('returns the module source when given the resolved virtual id', () => {
      const plugin = docCompiler(configFor());
      const result = (plugin.load as (id: string) => string | undefined)(
        '\0virtual:docs-compiler',
      );
      expect(result).toContain('export const doc');
    });

    it('returns the manifest source when given the resolved manifest id', async () => {
      const plugin = docCompiler(configFor());
      await startPlugin(plugin);
      const result = (plugin.load as (id: string) => string | undefined)(
        '\0virtual:docs-compiler/manifest',
      );
      expect(result).toContain('export default');
      expect(result).toContain('collections');
    });

    it('returns the page content when given a resolved content id', async () => {
      const plugin = docCompiler(configFor());
      await startPlugin(plugin);
      const result = (plugin.load as (id: string) => string | undefined)(
        '\0virtual:docs-compiler/content/0',
      );
      expect(result).toContain('export default');
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
    it('returns the resolved virtual id when given `virtual:docs-compiler`', () => {
      const plugin = docCompiler(configFor());
      const result = (plugin.resolveId as (id: string) => string | undefined)(
        'virtual:docs-compiler',
      );
      expect(result).toBe('\0virtual:docs-compiler');
    });

    it('returns the resolved manifest id when given the manifest id', () => {
      const plugin = docCompiler(configFor());
      const result = (plugin.resolveId as (id: string) => string | undefined)(
        'virtual:docs-compiler/manifest',
      );
      expect(result).toBe('\0virtual:docs-compiler/manifest');
    });

    it('returns the resolved content id when given a content id', () => {
      const plugin = docCompiler(configFor());
      const result = (plugin.resolveId as (id: string) => string | undefined)(
        'virtual:docs-compiler/content/5',
      );
      expect(result).toBe('\0virtual:docs-compiler/content/5');
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
