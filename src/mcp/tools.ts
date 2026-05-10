import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { extractMessages, extractSnippet } from '../compiler/index.js';
import { runCheck } from '../cli/commands/check.js';
import { runStatus } from '../cli/commands/status.js';
import { type YapyakConfig, loadConfig } from '../cli/config.js';
import { findFiles } from '../cli/find-files.js';
import { findBareBindings } from '../vite/find-bare-bindings.js';
import { messageHash } from '../vite/message-hash.js';
import type { ToolDefinition, ToolHandler, ToolResult } from './types.js';

interface MessageRecord {
  componentName: string;
  fileId: string;
  hash: string;
  line: number;
  snippet: string;
  source: string;
}

interface ToolContext {
  cwd: string;
}

function ok(payload: unknown): ToolResult {
  return {
    content: [{ text: JSON.stringify(payload, null, 2), type: 'text' }],
  };
}

function err(message: string): ToolResult {
  return {
    content: [{ text: message, type: 'text' }],
    isError: true,
  };
}

function loadAllMessages(
  cwd: string,
  config: YapyakConfig,
): MessageRecord[] {
  const factoryNames = new Set(config.factories);
  const intlModules = new Set(config.intlModules);
  const sourceFiles = findFiles({
    ignore: ['node_modules/**', 'dist/**', `${config.localesDir}/**`],
    patterns: config.source,
    root: cwd,
  });

  const records: MessageRecord[] = [];
  for (const file of sourceFiles) {
    const code = readFileSync(file, 'utf8');
    const fileId = relative(cwd, file).split(sep).join('/');
    const bareNames = findBareBindings({ code, intlModules });
    const messages = extractMessages({
      bareNames,
      code,
      factoryNames,
      fileId,
    });
    for (const message of messages) {
      records.push({
        componentName: message.context.componentName,
        fileId: message.fileId,
        hash: messageHash(message.fileId, message.source),
        line: message.line,
        snippet: extractSnippet({ code, line: message.line }),
        source: message.source,
      });
    }
  }
  return records;
}

function readLocaleJson(
  cwd: string,
  localesDir: string,
  locale: string,
): Record<string, Record<string, string>> {
  const path = join(cwd, localesDir, `${locale}.json`);
  if (!existsSync(path)) {
    return {};
  }
  const raw = readFileSync(path, 'utf8');
  if (raw.trim() === '') {
    return {};
  }
  return JSON.parse(raw);
}

function writeLocaleJson(
  cwd: string,
  localesDir: string,
  locale: string,
  json: Record<string, Record<string, string>>,
): void {
  const sorted: Record<string, Record<string, string>> = {};
  for (const fileId of Object.keys(json).sort()) {
    const entries = json[fileId] ?? {};
    const sortedEntries: Record<string, string> = {};
    for (const source of Object.keys(entries).sort()) {
      const value = entries[source];
      if (value !== undefined) {
        sortedEntries[source] = value;
      }
    }
    sorted[fileId] = sortedEntries;
  }
  const path = join(cwd, localesDir, `${locale}.json`);
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(sorted, null, 2)}\n`);
  renameSync(tmp, path);
}

interface CallSiteContext {
  attribute: string | null;
  parentElement: string | null;
  usage: 'jsx-child' | 'jsx-attribute' | 'plain-call';
}

function detectCallSiteContext(
  snippet: string,
  source: string,
): CallSiteContext {
  const lines = snippet.split('\n');
  let callLine: string | undefined;
  for (const line of lines) {
    if (line.includes(`t('${source}'`) || line.includes(`t("${source}"`)) {
      callLine = line;
      break;
    }
  }

  if (!callLine) {
    return { attribute: null, parentElement: null, usage: 'plain-call' };
  }

  const callIndex = Math.max(
    callLine.indexOf(`t('${source}'`),
    callLine.indexOf(`t("${source}"`),
  );
  const prefix = callLine.slice(0, callIndex).trimEnd();

  const attrMatch = prefix.match(/([a-zA-Z][a-zA-Z0-9-]*)=\{$/);
  if (attrMatch) {
    const parentElement = findParentElement(lines, callLine);
    return {
      attribute: attrMatch[1] ?? null,
      parentElement,
      usage: 'jsx-attribute',
    };
  }

  if (prefix.endsWith('{')) {
    const parentElement = findParentElement(lines, callLine);
    if (parentElement) {
      return { attribute: null, parentElement, usage: 'jsx-child' };
    }
  }

  return { attribute: null, parentElement: null, usage: 'plain-call' };
}

function findParentElement(
  lines: string[],
  callLine: string,
): string | null {
  const callIndex = lines.indexOf(callLine);
  for (let i = callIndex; i >= 0; i--) {
    const line = lines[i] ?? '';
    const matches = [...line.matchAll(/<([A-Za-z][A-Za-z0-9.]*)/g)];
    if (matches.length > 0) {
      const last = matches[matches.length - 1];
      return last?.[1] ?? null;
    }
  }
  return null;
}

export function buildTools(context: ToolContext): {
  definitions: ToolDefinition[];
  handlers: Record<string, ToolHandler>;
} {
  const definitions: ToolDefinition[] = [
    {
      description:
        'Return project config: defaultLocale, locales, localesDir, source patterns. Call this first to learn the setup.',
      inputSchema: { type: 'object' },
      name: 'get_config',
    },
    {
      description:
        'List all translatable messages discovered in the codebase, with their current translations across all locales.',
      inputSchema: { type: 'object' },
      name: 'list_messages',
    },
    {
      description:
        'List messages that are missing translations. Optionally filter to a specific locale.',
      inputSchema: {
        properties: {
          locale: {
            description:
              'Locale code to filter by (e.g. "sv"). If omitted, returns messages missing in any locale.',
            type: 'string',
          },
        },
        type: 'object',
      },
      name: 'list_missing',
    },
    {
      description:
        'Read a single message by hash with full call-site context: source string, file, component, line number, surrounding code snippet, parent JSX element, attribute name (if used as prop like aria-label), and current translations.',
      inputSchema: {
        properties: {
          hash: {
            description: 'Message hash from list_messages or list_missing.',
            type: 'string',
          },
        },
        required: ['hash'],
        type: 'object',
      },
      name: 'read_message',
    },
    {
      description:
        'Write a translation for a specific message and locale. Use write_translations for batches — calling this in a loop is wasteful.',
      inputSchema: {
        properties: {
          hash: { description: 'Message hash.', type: 'string' },
          locale: { description: 'Locale code (e.g. "sv").', type: 'string' },
          value: { description: 'Translated string.', type: 'string' },
        },
        required: ['hash', 'locale', 'value'],
        type: 'object',
      },
      name: 'write_translation',
    },
    {
      description:
        'Write multiple translations atomically per locale file. Use this when filling in more than one missing translation.',
      inputSchema: {
        properties: {
          updates: {
            description:
              'Array of { hash, locale, value } updates. Multiple locales are batched per file.',
            type: 'array',
          },
        },
        required: ['updates'],
        type: 'object',
      },
      name: 'write_translations',
    },
    {
      description:
        'Remove a translation entry from a specific locale. Used to revert a string back to "missing" state so it can be re-translated cleanly.',
      inputSchema: {
        properties: {
          hash: { description: 'Message hash.', type: 'string' },
          locale: { description: 'Locale code.', type: 'string' },
        },
        required: ['hash', 'locale'],
        type: 'object',
      },
      name: 'remove_translation',
    },
    {
      description:
        'Auto-remove all stale entries (translations whose source no longer exists in the codebase). Equivalent to `yapyak check --write` for the prune step. Returns count of removed entries per locale.',
      inputSchema: { type: 'object' },
      name: 'prune_stale',
    },
    {
      description:
        'Validate the project: missing translations, stale entries, invalid JSON. Each issue includes an autoFixable flag — true means prune_stale will resolve it safely; false means human/agent translation is required.',
      inputSchema: { type: 'object' },
      name: 'validate',
    },
  ];

  const handlers: Record<string, ToolHandler> = {
    async get_config() {
      const config = loadConfig(context.cwd);
      return ok({
        defaultLocale: config.defaultLocale,
        factories: config.factories,
        intlModules: config.intlModules,
        locales: config.locales,
        localesDir: config.localesDir,
        source: config.source,
      });
    },

    async list_messages() {
      const config = loadConfig(context.cwd);
      const messages = loadAllMessages(context.cwd, config);
      const localeJson: Record<
        string,
        Record<string, Record<string, string>>
      > = {};
      for (const locale of config.locales) {
        localeJson[locale] = readLocaleJson(
          context.cwd,
          config.localesDir,
          locale,
        );
      }
      const result = messages.map((m) => ({
        componentName: m.componentName,
        fileId: m.fileId,
        hash: m.hash,
        line: m.line,
        source: m.source,
        translations: Object.fromEntries(
          config.locales.map((locale) => [
            locale,
            localeJson[locale]?.[m.fileId]?.[m.source] ?? null,
          ]),
        ),
      }));
      return ok({
        defaultLocale: config.defaultLocale,
        locales: config.locales,
        messages: result,
        totalMessages: messages.length,
      });
    },

    async list_missing(args) {
      const filterLocale =
        typeof args.locale === 'string' ? args.locale : undefined;
      const status = runStatus(context.cwd);
      let missing = status.missing;
      if (filterLocale !== undefined) {
        missing = missing.filter((m) =>
          m.missingLocales.includes(filterLocale),
        );
      }
      return ok({
        defaultLocale: status.defaultLocale,
        locales: status.locales,
        missing,
        perLocale: status.perLocale,
        totalMessages: status.totalMessages,
      });
    },

    async read_message(args) {
      const hash = typeof args.hash === 'string' ? args.hash : undefined;
      if (!hash) {
        return err('hash is required');
      }
      const config = loadConfig(context.cwd);
      const messages = loadAllMessages(context.cwd, config);
      const match = messages.find((m) => m.hash === hash);
      if (!match) {
        return err(`Message not found for hash: ${hash}`);
      }
      const translations: Record<string, string | null> = {};
      for (const locale of config.locales) {
        const json = readLocaleJson(context.cwd, config.localesDir, locale);
        const value = json[match.fileId]?.[match.source];
        translations[locale] = value ?? null;
      }
      const callSite = detectCallSiteContext(match.snippet, match.source);
      return ok({
        absolutePath: join(context.cwd, match.fileId),
        callSite,
        componentName: match.componentName,
        fileId: match.fileId,
        hash: match.hash,
        line: match.line,
        snippet: match.snippet,
        source: match.source,
        translations,
      });
    },

    async write_translation(args) {
      const hash = typeof args.hash === 'string' ? args.hash : undefined;
      const locale = typeof args.locale === 'string' ? args.locale : undefined;
      const value = typeof args.value === 'string' ? args.value : undefined;
      if (!hash || !locale || value === undefined) {
        return err('hash, locale, and value are all required');
      }
      const config = loadConfig(context.cwd);
      if (!config.locales.includes(locale)) {
        return err(
          `Unknown locale "${locale}". Configured locales: ${config.locales.join(', ')}`,
        );
      }
      const messages = loadAllMessages(context.cwd, config);
      const match = messages.find((m) => m.hash === hash);
      if (!match) {
        return err(`Message not found for hash: ${hash}`);
      }
      const json = readLocaleJson(context.cwd, config.localesDir, locale);
      const file = json[match.fileId] ?? {};
      file[match.source] = value;
      json[match.fileId] = file;
      writeLocaleJson(context.cwd, config.localesDir, locale, json);
      return ok({
        fileId: match.fileId,
        hash,
        locale,
        source: match.source,
        value,
        written: true,
      });
    },

    async write_translations(args) {
      const updates = Array.isArray(args.updates) ? args.updates : undefined;
      if (!updates) {
        return err('updates must be an array of { hash, locale, value }');
      }
      const config = loadConfig(context.cwd);
      const messages = loadAllMessages(context.cwd, config);
      const messagesByHash = new Map(messages.map((m) => [m.hash, m]));

      const perLocale = new Map<
        string,
        Record<string, Record<string, string>>
      >();
      const written: Array<{
        fileId: string;
        hash: string;
        locale: string;
        source: string;
        value: string;
      }> = [];
      const errors: Array<{ index: number; reason: string }> = [];

      for (let i = 0; i < updates.length; i++) {
        const u = updates[i] as Record<string, unknown> | undefined;
        const hash = typeof u?.hash === 'string' ? u.hash : undefined;
        const locale = typeof u?.locale === 'string' ? u.locale : undefined;
        const value = typeof u?.value === 'string' ? u.value : undefined;
        if (!hash || !locale || value === undefined) {
          errors.push({
            index: i,
            reason: 'each update needs { hash, locale, value }',
          });
          continue;
        }
        if (!config.locales.includes(locale)) {
          errors.push({
            index: i,
            reason: `unknown locale "${locale}"`,
          });
          continue;
        }
        const match = messagesByHash.get(hash);
        if (!match) {
          errors.push({
            index: i,
            reason: `unknown message hash: ${hash}`,
          });
          continue;
        }
        let json = perLocale.get(locale);
        if (!json) {
          json = readLocaleJson(context.cwd, config.localesDir, locale);
          perLocale.set(locale, json);
        }
        const file = json[match.fileId] ?? {};
        file[match.source] = value;
        json[match.fileId] = file;
        written.push({
          fileId: match.fileId,
          hash,
          locale,
          source: match.source,
          value,
        });
      }

      for (const [locale, json] of perLocale) {
        writeLocaleJson(context.cwd, config.localesDir, locale, json);
      }

      return ok({
        errors,
        localesAffected: [...perLocale.keys()].sort(),
        written: written.length,
        writtenEntries: written,
      });
    },

    async remove_translation(args) {
      const hash = typeof args.hash === 'string' ? args.hash : undefined;
      const locale = typeof args.locale === 'string' ? args.locale : undefined;
      if (!hash || !locale) {
        return err('hash and locale are required');
      }
      const config = loadConfig(context.cwd);
      const messages = loadAllMessages(context.cwd, config);
      const match = messages.find((m) => m.hash === hash);
      if (!match) {
        return err(`Message not found for hash: ${hash}`);
      }
      const json = readLocaleJson(context.cwd, config.localesDir, locale);
      const file = json[match.fileId];
      if (!file || !(match.source in file)) {
        return ok({ removed: false, reason: 'no entry to remove' });
      }
      delete file[match.source];
      if (Object.keys(file).length === 0) {
        delete json[match.fileId];
      } else {
        json[match.fileId] = file;
      }
      writeLocaleJson(context.cwd, config.localesDir, locale, json);
      return ok({
        fileId: match.fileId,
        hash,
        locale,
        removed: true,
        source: match.source,
      });
    },

    async prune_stale() {
      const config = loadConfig(context.cwd);
      const messages = loadAllMessages(context.cwd, config);
      const liveSources = new Set(
        messages.map((m) => `${m.fileId} ${m.source}`),
      );
      const removed: Array<{
        fileId: string;
        locale: string;
        source: string;
      }> = [];
      for (const locale of config.locales) {
        const json = readLocaleJson(context.cwd, config.localesDir, locale);
        let touched = false;
        for (const [fileId, entries] of Object.entries(json)) {
          for (const source of Object.keys(entries)) {
            if (!liveSources.has(`${fileId} ${source}`)) {
              delete entries[source];
              removed.push({ fileId, locale, source });
              touched = true;
            }
          }
          if (Object.keys(entries).length === 0) {
            delete json[fileId];
            touched = true;
          }
        }
        if (touched) {
          writeLocaleJson(context.cwd, config.localesDir, locale, json);
        }
      }
      return ok({
        removed: removed.length,
        removedEntries: removed,
      });
    },

    async validate() {
      const result = runCheck(context.cwd);
      const issues = result.issues.map((issue) => ({
        ...issue,
        autoFixable: issue.kind === 'stale',
      }));
      return ok({
        autoFixableCount: issues.filter((i) => i.autoFixable).length,
        issues,
        totalSources: result.totalSources,
      });
    },
  };

  return { definitions, handlers };
}
