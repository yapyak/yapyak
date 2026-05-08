import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';
import { type AiOptions, resolveProvider } from '../ai/index.js';
import { compileLocale } from '../compiler/index.js';
import { type AutoTranslator, createAutoTranslator } from './auto-translate.js';
import { findBareBindings } from './find-bare-bindings.js';
import { generateIntlModule } from './generate-intl-module.js';
import { generateTypes } from './generate-types.js';
import { loadTranslations } from './load-translations.js';
import { transformSource } from './transform-source.js';

export interface YapyakPluginOptions {
  acceptLanguage?: boolean;
  ai?: AiOptions;
  cookie?: string;
  defaultLocale?: string;
  factories?: string[];
  framework?: 'react' | 'vue';
  intlModules?: string[];
  locales?: string[];
  localesDir?: string;
  moduleName?: string;
  source?: string[];
}

export const CACHE_DIR = 'node_modules/.cache/yapyak';

interface SerializedAi {
  apiKey: string;
  glossary: Record<string, Record<string, string>>;
  model?: string;
  provider: 'anthropic' | 'openai';
  voice: string;
}

function serializableAi(ai: AiOptions | undefined): SerializedAi | undefined {
  if (!ai) {
    return undefined;
  }
  if (ai.provider !== 'anthropic' && ai.provider !== 'openai') {
    return undefined;
  }
  const result: SerializedAi = {
    apiKey: ai.apiKey,
    glossary: ai.glossary ?? {},
    provider: ai.provider,
    voice: ai.voice ?? '',
  };
  if (ai.model) {
    result.model = ai.model;
  }
  return result;
}

function detectTanStack(projectRoot: string): boolean {
  const pkgPath = join(projectRoot, 'package.json');
  if (!existsSync(pkgPath)) {
    return false;
  }
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    const deps = {
      ...(pkg.dependencies ?? {}),
      ...(pkg.devDependencies ?? {}),
    };
    return '@tanstack/react-start' in deps;
  } catch {
    return false;
  }
}

export function yapyak(options: YapyakPluginOptions = {}): Plugin {
  const {
    acceptLanguage = false,
    ai,
    cookie,
    defaultLocale = 'en',
    factories = ['intl'],
    framework = 'react',
    intlModules = [],
    locales = [defaultLocale],
    localesDir = 'locales',
    moduleName = 'yapyak',
    source = ['src/**/*.{ts,tsx,js,jsx,mjs,cjs}'],
  } = options;

  const autoTranslate = ai?.autoTranslate ?? false;
  const voice = ai?.voice ?? '';
  const glossary = ai?.glossary ?? {};

  const VIRTUAL_INTL = moduleName;
  const VIRTUAL_INTL_RESOLVED = `\0${moduleName}`;
  const VIRTUAL_LOCALE_PREFIX = `${moduleName}/locale-`;
  const VIRTUAL_LOCALE_RESOLVED_PREFIX = `\0${moduleName}/locale-`;

  const factoryNames = new Set(factories);
  const intlModuleSet = new Set([VIRTUAL_INTL, ...intlModules]);
  let projectRoot = process.cwd();
  let server: ViteDevServer | undefined;
  let autoTranslator: AutoTranslator | undefined;

  function writeTypes(): void {
    const sourcePath = join(projectRoot, localesDir, `${defaultLocale}.json`);
    let translations: Record<string, Record<string, string>> = {};
    if (existsSync(sourcePath)) {
      try {
        const raw = readFileSync(sourcePath, 'utf8');
        if (raw.trim() !== '') {
          translations = JSON.parse(raw);
        }
      } catch {
        translations = {};
      }
    }
    const types = generateTypes({
      defaultLocale,
      framework,
      locales,
      moduleName,
      translations,
    });
    const cacheDir = join(projectRoot, CACHE_DIR);
    mkdirSync(cacheDir, { recursive: true });
    writeFileSync(join(cacheDir, 'types.d.ts'), types);
  }

  function stripQuery(id: string): string {
    const queryIndex = id.indexOf('?');
    return queryIndex === -1 ? id : id.slice(0, queryIndex);
  }

  function isSourceFile(id: string): boolean {
    if (id.includes('node_modules')) {
      return false;
    }
    if (id.startsWith('\0')) {
      return false;
    }
    const cleaned = stripQuery(id);
    return /\.(?:tsx?|jsx?|mjs|cjs)$/.test(cleaned);
  }

  function toFileId(id: string): string {
    const cleaned = stripQuery(id);
    const normalized = relative(projectRoot, cleaned).split(sep).join('/');
    return normalized;
  }

  function virtualToLocale(id: string): string | undefined {
    if (!id.startsWith(VIRTUAL_LOCALE_RESOLVED_PREFIX)) {
      return undefined;
    }
    return id.slice(VIRTUAL_LOCALE_RESOLVED_PREFIX.length);
  }

  return {
    name: 'yapyak',
    enforce: 'pre',

    configResolved(config): void {
      projectRoot = config.root;
      const cacheDir = join(projectRoot, CACHE_DIR);
      mkdirSync(cacheDir, { recursive: true });

      writeTypes();

      const cachedConfig = {
        ai: serializableAi(ai),
        defaultLocale,
        factories,
        intlModules: [moduleName, ...intlModules],
        locales,
        localesDir,
        source,
      };
      writeFileSync(
        join(cacheDir, 'config.json'),
        `${JSON.stringify(cachedConfig, null, 2)}\n`,
      );
    },

    configureServer(devServer): void {
      server = devServer;

      if (autoTranslate) {
        if (!ai) {
          process.stderr.write(
            '[yapyak] autoTranslate is enabled but `ai` is not configured\n',
          );
        } else {
          try {
            const provider = resolveProvider(ai);
            autoTranslator = createAutoTranslator({
              defaultLocale,
              factories,
              glossary,
              intlModules: [moduleName, ...intlModules],
              locales,
              localesDir,
              projectRoot,
              provider,
              voice,
            });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            process.stderr.write(`[yapyak] ai provider error: ${message}\n`);
          }
        }
      }

      devServer.watcher.add(join(projectRoot, localesDir));
      devServer.watcher.on('change', (path) => {
        const dir = resolve(projectRoot, localesDir);
        if (!path.startsWith(dir)) {
          return;
        }
        if (path.endsWith(`${defaultLocale}.json`)) {
          writeTypes();
        }
        for (const locale of locales) {
          const moduleId = `${VIRTUAL_LOCALE_RESOLVED_PREFIX}${locale}`;
          const module = devServer.moduleGraph.getModuleById(moduleId);
          if (module) {
            devServer.moduleGraph.invalidateModule(module);
          }
        }
        devServer.ws.send({ type: 'full-reload' });
      });
    },

    resolveId(id): string | undefined {
      if (id === VIRTUAL_INTL) {
        return VIRTUAL_INTL_RESOLVED;
      }
      if (id.startsWith(VIRTUAL_LOCALE_PREFIX)) {
        return `\0${id}`;
      }
      return undefined;
    },

    load(id): string | undefined {
      if (id === VIRTUAL_INTL_RESOLVED) {
        return generateIntlModule({
          acceptLanguage,
          cookie,
          defaultLocale,
          framework,
          hasTanStack: detectTanStack(projectRoot),
          locales,
          moduleName,
        });
      }
      const locale = virtualToLocale(id);
      if (!locale) {
        return undefined;
      }
      const translations = loadTranslations({
        locale,
        localesDir,
        projectRoot,
      });
      const compiled = compileLocale({
        locale,
        translations,
      });
      return compiled.code;
    },

    transform(code, id): { code: string } | undefined {
      if (!isSourceFile(id)) {
        return undefined;
      }
      const fileId = toFileId(id);
      const bareNames = findBareBindings({
        code,
        intlModules: intlModuleSet,
      });
      const result = transformSource({
        bareNames,
        code,
        factoryNames,
        fileId,
      });
      if (result.count === 0) {
        return undefined;
      }
      if (autoTranslator) {
        const cleaned = stripQuery(id);
        void autoTranslator.onSourceFileChange(cleaned);
      }
      return { code: result.code };
    },

    handleHotUpdate(ctx): void {
      const dir = resolve(projectRoot, localesDir);
      if (!ctx.file.startsWith(dir)) {
        return;
      }
      const moduleIds = locales.map(
        (locale) => `${VIRTUAL_LOCALE_RESOLVED_PREFIX}${locale}`,
      );
      const modules = moduleIds
        .map((moduleId) => server?.moduleGraph.getModuleById(moduleId))
        .filter(
          (module): module is NonNullable<typeof module> =>
            module !== undefined,
        );
      if (modules.length > 0) {
        server?.ws.send({ type: 'full-reload' });
      }
    },
  };
}
