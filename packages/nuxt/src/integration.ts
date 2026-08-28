import type { NuxtModule } from 'nuxt/schema';

import {
  addComponent,
  addImports,
  addPlugin,
  addServerPlugin,
  addServerTemplate,
  addVitePlugin,
  createResolver,
  defineNuxtModule,
  useLogger,
} from '@nuxt/kit';
import { yapyak } from '@yapyak/vite';
import { discoverLocales } from 'yapyak/compiler/internal';
import { defineRuntime, loadYapyakConfig } from 'yapyak/config/internal';

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

/**
 * Options for the yapyak Nuxt module.
 *
 * @example
 * ```ts [nuxt.config.ts]
 * export default defineNuxtConfig({
 *   modules: ['@yapyak/nuxt'],
 *   yapyak: {
 *     fixedLocale: 'en'
 *   }
 * });
 * ```
 */
export type ModuleOptions = {
  /**
   * Locks the build to a single locale.
   *
   * @remarks
   * Must be one of the configured locales. Throws at config resolution if not.
   */
  fixedLocale?: string;
};

const CONFIG_FILES = [
  'yapyak.config.ts',
  'yapyak.config.mts',
  'yapyak.config.mjs',
  'yapyak.config.js',
];

const STARTER_CONFIG = `import { defineConfig } from 'yapyak/config';
import { nuxt } from '@yapyak/nuxt/processor';

export default defineConfig({
  persistence: 'cookie',
  processors: [nuxt()],
  syncHtmlAttributes: true
});
`;

const { version } = JSON.parse(
  readFileSync(join(import.meta.dirname, '..', 'package.json'), 'utf-8'),
) as {
  version: string;
};

/**
 * The yapyak Nuxt module.
 */
const module: NuxtModule<ModuleOptions> = defineNuxtModule<ModuleOptions>({
  meta: {
    compatibility: {
      nuxt: '>=4.1.0',
    },
    configKey: 'yapyak',
    name: '@yapyak/nuxt',
    version,
  },
  onInstall(nuxt) {
    const hasConfig = CONFIG_FILES.some((name) =>
      existsSync(join(nuxt.options.rootDir, name)),
    );
    if (hasConfig) {
      return;
    }
    writeFileSync(
      join(nuxt.options.rootDir, 'yapyak.config.ts'),
      STARTER_CONFIG,
    );
    useLogger('yapyak').info('Created yapyak.config.ts');
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);
    const { config } = await loadYapyakConfig(nuxt.options.rootDir);
    addVitePlugin(() =>
      yapyak({
        root: nuxt.options.rootDir,
        ...(options.fixedLocale !== undefined && {
          fixedLocale: options.fixedLocale,
        }),
      }),
    );
    addPlugin({
      mode: 'server',
      src: resolver.resolve('./runtime/plugin'),
    });
    addServerPlugin(resolver.resolve('./runtime/nitro'));
    addServerTemplate({
      filename: 'yapyak/runtime',
      getContents: () => {
        const { defaultLocale, locales } = discoverLocales(
          config.localesDir,
          nuxt.options.rootDir,
          {
            defaultLocale: config.defaultLocale,
          },
        );
        return defineRuntime({
          defaultLocale,
          detectUserLocale: config.detectUserLocale,
          locales,
          persistence: config.persistence,
          syncHtmlAttributes: config.syncHtmlAttributes,
        });
      },
    });
    const requireFromHere = createRequire(import.meta.url);
    nuxt.options.nitro.alias ??= {};
    Object.assign(nuxt.options.nitro.alias, {
      yapyak: requireFromHere.resolve('yapyak'),
      'yapyak/adapter': requireFromHere.resolve('yapyak/adapter'),
      'yapyak/adapter/internal': requireFromHere.resolve(
        'yapyak/adapter/internal',
      ),
    });
    nuxt.options.nitro.externals ??= {};
    nuxt.options.nitro.externals.inline ??= [];
    nuxt.options.nitro.externals.inline.push(
      'yapyak',
      '@yapyak/',
      dirname(requireFromHere.resolve('yapyak')),
    );
    addComponent({
      export: 'RichText',
      filePath: '@yapyak/vue',
      name: 'RichText',
    });
    const hasAmbientT = config.processors.some(
      (processor) => processor.ambientBindings?.includes('t') === true,
    );
    if (hasAmbientT) {
      addImports({
        from: 'yapyak',
        name: 't',
      });
      nuxt.hook('imports:extend', (imports) => {
        const foreign = imports.find(
          (entry) =>
            (entry.as ?? entry.name) === 't' && entry.from !== 'yapyak',
        );
        if (foreign !== undefined) {
          throw new Error(
            `[yapyak] '${foreign.from}' also auto-imports 't'. yapyak binds unbound t() calls to its own t, so the two collide. ` +
              `Rename the other import, or set explicitImports: true on nuxt() in yapyak.config.ts and import t from 'yapyak' yourself.`,
          );
        }
      });
    }
    const toTypesPath = (id: string): string =>
      requireFromHere.resolve(id).replace(/\.js$/, '.d.ts');
    const requireFromApp = createRequire(
      join(nuxt.options.rootDir, 'package.json'),
    );
    const typePaths = {
      '@yapyak/vue': [
        toTypesPath('@yapyak/vue'),
      ],
      vue: [
        dirname(requireFromApp.resolve('vue/package.json')),
      ],
      yapyak: [
        toTypesPath('yapyak'),
      ],
      'yapyak/adapter': [
        toTypesPath('yapyak/adapter'),
      ],
      'yapyak/config': [
        toTypesPath('yapyak/config'),
      ],
    };
    nuxt.options.typescript.tsConfig.include ??= [];
    nuxt.options.typescript.tsConfig.include.push('../.yapyak/types.d.ts');
    nuxt.options.typescript.tsConfig.compilerOptions ??= {};
    nuxt.options.typescript.tsConfig.compilerOptions.paths ??= {};
    Object.assign(
      nuxt.options.typescript.tsConfig.compilerOptions.paths,
      typePaths,
    );
  },
});

export default module;
