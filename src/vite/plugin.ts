import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';
import { type AiOptions, resolveProvider } from '../ai/index.js';
import { type AutoTranslator, createAutoTranslator } from './auto-translate.js';
import { findBareBindings } from './find-bare-bindings.js';
import { generateIntlModule } from './generate-intl-module.js';
import {
  generateMessagesModule,
  type MessageEntry,
} from './generate-messages-module.js';
import { generateTypes } from './generate-types.js';
import { loadTranslations } from './load-translations.js';
import {
  normalizePersistence,
  type Persistence,
} from './normalize-persistence.js';
import { transformSource } from './transform-source.js';

export type Adapter = 'tanstackStart' | 'sveltekit' | null;

export type Framework = 'react' | 'vue' | 'svelte' | null;

export interface YapyakPluginOptions {
  acceptLanguage?: boolean;
  adapter?: Adapter;
  ai?: AiOptions;
  defaultLocale?: string;
  factories?: string[];
  framework?: Framework;
  intlModules?: string[];
  locales?: string[];
  localesDir?: string;
  moduleName?: string;
  persistence?: Persistence;
  source?: string[];
  syncHtmlLang?: boolean;
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

export function yapyak(options: YapyakPluginOptions = {}): Plugin {
  const {
    acceptLanguage = false,
    adapter = null,
    ai,
    defaultLocale = 'en',
    factories = ['intl'],
    framework = null,
    intlModules = [],
    locales = [defaultLocale],
    localesDir = 'locales',
    moduleName = 'yapyak',
    persistence: persistenceOption,
    source = ['src/**/*.{ts,tsx,js,jsx,mjs,cjs,vue,svelte}'],
    syncHtmlLang = false,
  } = options;

  const persistence = normalizePersistence(persistenceOption);

  const autoTranslate = ai?.autoTranslate ?? false;
  const voice = ai?.voice ?? '';
  const glossary = ai?.glossary ?? {};
  const contextMode = ai?.context ?? 'full';

  const VIRTUAL_INTL = moduleName;
  const VIRTUAL_INTL_RESOLVED = `\0${moduleName}`;
  const VIRTUAL_MESSAGES = `${moduleName}/messages`;
  const VIRTUAL_MESSAGES_RESOLVED = `\0${moduleName}/messages`;
  const VIRTUAL_CONFIG = `${moduleName}/internal/config`;
  const VIRTUAL_CONFIG_RESOLVED = `\0${moduleName}/internal/config`;

  const factoryNames = new Set(factories);
  const intlModuleSet = new Set([VIRTUAL_INTL, ...intlModules]);
  const messageRegistry = new Map<string, MessageEntry>();
  const fileHashes = new Map<string, Set<string>>();
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
    return /\.(?:tsx?|jsx?|mjs|cjs|vue|svelte)$/.test(cleaned);
  }

  function toFileId(id: string): string {
    const cleaned = stripQuery(id);
    const normalized = relative(projectRoot, cleaned).split(sep).join('/');
    return normalized;
  }

  function updateFileMessages(
    fileId: string,
    messages: { fileId: string; hash: string; source: string }[],
  ): boolean {
    const previous = fileHashes.get(fileId);
    let changed = false;
    if (previous) {
      for (const hash of previous) {
        if (!messages.some((m) => m.hash === hash)) {
          messageRegistry.delete(hash);
          changed = true;
        }
      }
    }
    const current = new Set<string>();
    for (const message of messages) {
      current.add(message.hash);
      if (!messageRegistry.has(message.hash)) {
        changed = true;
      }
      messageRegistry.set(message.hash, message);
    }
    fileHashes.set(fileId, current);
    return changed;
  }

  function invalidateMessagesModule(): void {
    if (!server) {
      return;
    }
    const module = server.moduleGraph.getModuleById(VIRTUAL_MESSAGES_RESOLVED);
    if (module) {
      server.moduleGraph.invalidateModule(module);
      server.ws.send({ type: 'full-reload' });
    }
  }

  function loadAllTranslations(): Record<
    string,
    Record<string, Record<string, string>>
  > {
    const result: Record<string, Record<string, Record<string, string>>> = {};
    for (const locale of locales) {
      result[locale] = loadTranslations({ locale, localesDir, projectRoot });
    }
    return result;
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
              contextMode,
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
        invalidateMessagesModule();
      });
    },

    resolveId(id): string | undefined {
      if (id === VIRTUAL_INTL) {
        return VIRTUAL_INTL_RESOLVED;
      }
      if (id === VIRTUAL_MESSAGES) {
        return VIRTUAL_MESSAGES_RESOLVED;
      }
      if (id === VIRTUAL_CONFIG) {
        return VIRTUAL_CONFIG_RESOLVED;
      }
      return undefined;
    },

    load(id): string | undefined {
      if (id === VIRTUAL_INTL_RESOLVED) {
        return generateIntlModule({
          acceptLanguage,
          adapter,
          defaultLocale,
          framework,
          locales,
          moduleName,
          persistence,
          syncHtmlLang,
        });
      }
      if (id === VIRTUAL_MESSAGES_RESOLVED) {
        const translations = loadAllTranslations();
        const messages = [...messageRegistry.values()].sort((a, b) =>
          a.hash.localeCompare(b.hash),
        );
        return generateMessagesModule({
          defaultLocale,
          locales,
          messages,
          translations,
        });
      }
      if (id === VIRTUAL_CONFIG_RESOLVED) {
        const cookieName =
          persistence.type === 'cookie' ? persistence.name : 'locale';
        return `export const config = ${JSON.stringify(
          { cookieName, defaultLocale },
          null,
          2,
        )};\n`;
      }
      return undefined;
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
        if (fileHashes.has(fileId)) {
          updateFileMessages(fileId, []);
          invalidateMessagesModule();
        }
        return undefined;
      }
      const changed = updateFileMessages(fileId, result.messages);
      if (changed) {
        invalidateMessagesModule();
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
      invalidateMessagesModule();
    },
  };
}
