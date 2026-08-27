import type { Nuxt } from 'nuxt/schema';

import {
  addComponent,
  addImports,
  addPlugin,
  addServerPlugin,
  addServerTemplate,
  addVitePlugin,
} from '@nuxt/kit';
import { yapyak } from '@yapyak/vite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import module from './integration';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

vi.mock('@nuxt/kit', () => ({
  addComponent: vi.fn(),
  addImports: vi.fn(),
  addPlugin: vi.fn(),
  addServerPlugin: vi.fn(),
  addServerTemplate: vi.fn(),
  addVitePlugin: vi.fn(),
  createResolver: () => ({
    resolve: (path: string) => `resolved:${path}`,
  }),
  defineNuxtModule: (definition: unknown) => definition,
  useLogger: () => ({
    info: vi.fn(),
  }),
}));

vi.mock('@yapyak/vite', () => ({
  yapyak: vi.fn(() => []),
}));

vi.mock('yapyak/compiler/internal', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('yapyak/compiler/internal')>();
  return {
    ...actual,
    discoverLocales: vi.fn(() => ({
      defaultLocale: 'en',
      locales: [
        'en',
        'sv',
      ],
      warnings: [],
    })),
  };
});

vi.mock('yapyak/config/internal', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('yapyak/config/internal')>();
  return {
    ...actual,
    loadYapyakConfig: vi.fn(async () => ({
      config: {
        defaultLocale: 'en',
        detectUserLocale: false,
        localesDir: 'locales',
        persistence: {
          name: 'locale',
          type: 'cookie',
        },
        processors: [
          {
            ambientBindings: [
              't',
            ],
          },
        ],
        syncHtmlAttributes: true,
      },
    })),
  };
});

const definition = module as unknown as {
  meta: {
    configKey: string;
    name: string;
  };
  onInstall: (nuxt: Nuxt) => void;
  setup: (
    options: {
      fixedLocale?: string;
    },
    nuxt: Nuxt,
  ) => Promise<void>;
};

let rootDir = '';

function makeNuxt(): Nuxt {
  return {
    hook: vi.fn(),
    options: {
      nitro: {},
      rootDir,
      typescript: {
        tsConfig: {},
      },
    },
  } as unknown as Nuxt;
}

beforeEach(() => {
  rootDir = mkdtempSync(join(tmpdir(), 'yapyak-nuxt-'));
});

afterEach(() => {
  rmSync(rootDir, {
    force: true,
    recursive: true,
  });
  vi.clearAllMocks();
});

describe('module', () => {
  it('holds the `@yapyak/nuxt` meta', () => {
    expect(definition.meta.name).toBe('@yapyak/nuxt');
    expect(definition.meta.configKey).toBe('yapyak');
  });

  it('writes the starter config when none exists', () => {
    definition.onInstall(makeNuxt());

    const written = readFileSync(join(rootDir, 'yapyak.config.ts'), 'utf-8');
    expect(written).toContain('processors: [nuxt()]');
  });

  it('preserves an existing config', () => {
    writeFileSync(join(rootDir, 'yapyak.config.mts'), 'export default {};');

    definition.onInstall(makeNuxt());

    expect(existsSync(join(rootDir, 'yapyak.config.ts'))).toBe(false);
    expect(readFileSync(join(rootDir, 'yapyak.config.mts'), 'utf-8')).toBe(
      'export default {};',
    );
  });

  describe('with defaults', () => {
    it('registers the yapyak Vite plugin for the project root', async () => {
      await definition.setup({}, makeNuxt());

      const factory = vi.mocked(addVitePlugin).mock.calls[0]?.[0] as () => void;
      factory();
      expect(yapyak).toHaveBeenCalledWith({
        root: rootDir,
      });
    });

    it('registers the server plugins', async () => {
      await definition.setup({}, makeNuxt());

      expect(addPlugin).toHaveBeenCalledWith({
        mode: 'server',
        src: 'resolved:./runtime/plugin',
      });
      expect(addServerPlugin).toHaveBeenCalledWith('resolved:./runtime/nitro');
    });

    it('writes the runtime constants into the Nitro graph', async () => {
      const nuxt = makeNuxt();
      await definition.setup({}, nuxt);

      const template = vi.mocked(addServerTemplate).mock.calls[0]?.[0] as {
        filename: string;
        getContents: () => string;
      };
      expect(template.filename).toBe('yapyak/runtime');
      expect(template.getContents()).toContain('"sv"');
      expect(nuxt.options.nitro.externals?.inline).toContain('@yapyak/');
      expect(Object.keys(nuxt.options.nitro.alias ?? {})).toContain(
        'yapyak/adapter/internal',
      );
    });

    it('registers `RichText` and the `t` auto-import', async () => {
      await definition.setup({}, makeNuxt());

      expect(addComponent).toHaveBeenCalledWith({
        export: 'RichText',
        filePath: '@yapyak/vue',
        name: 'RichText',
      });
      expect(addImports).toHaveBeenCalledWith({
        from: 'yapyak',
        name: 't',
      });
    });

    it('maps the type paths into the generated tsconfig', async () => {
      const nuxt = makeNuxt();
      await definition.setup({}, nuxt);

      const paths = nuxt.options.typescript.tsConfig.compilerOptions
        ?.paths as Record<string, string[]>;
      expect(Object.keys(paths)).toEqual([
        '@yapyak/vue',
        'vue',
        'yapyak',
        'yapyak/adapter',
        'yapyak/config',
      ]);
      expect(nuxt.options.typescript.tsConfig.include).toContain(
        '../.yapyak/types.d.ts',
      );
    });

    it('throws when another module also auto-imports `t`', async () => {
      const nuxt = makeNuxt();
      await definition.setup({}, nuxt);

      const listener = vi
        .mocked(nuxt.hook)
        .mock.calls.find(([name]) => name === 'imports:extend')?.[1] as (
        imports: {
          from: string;
          name: string;
        }[],
      ) => void;
      expect(() =>
        listener([
          {
            from: '@nuxtjs/i18n',
            name: 't',
          },
        ]),
      ).toThrow(/also auto-imports 't'/);
      expect(() =>
        listener([
          {
            from: 'yapyak',
            name: 't',
          },
        ]),
      ).not.toThrow();
    });
  });

  describe('with overrides', () => {
    it('skips the `t` auto-import without ambient bindings', async () => {
      const { loadYapyakConfig } = await import('yapyak/config/internal');
      vi.mocked(loadYapyakConfig).mockResolvedValueOnce({
        config: {
          processors: [
            {},
          ],
        },
      } as unknown as Awaited<ReturnType<typeof loadYapyakConfig>>);

      await definition.setup({}, makeNuxt());

      expect(addImports).not.toHaveBeenCalled();
    });

    it('forwards `fixedLocale` to the yapyak Vite plugin', async () => {
      await definition.setup(
        {
          fixedLocale: 'sv',
        },
        makeNuxt(),
      );

      const factory = vi.mocked(addVitePlugin).mock.calls[0]?.[0] as () => void;
      factory();
      expect(yapyak).toHaveBeenCalledWith({
        fixedLocale: 'sv',
        root: rootDir,
      });
    });
  });
});
