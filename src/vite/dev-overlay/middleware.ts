import type { IncomingMessage, ServerResponse } from 'node:http';
import type { ContextMode, Provider } from '../../ai/index.js';
import type { MessageEntry } from '../generate-messages-module.js';
import { regenerateTranslation } from './regenerate.js';
import {
  createTranslationStore,
  type TranslationStore,
} from './translation-store.js';

type Next = (err?: unknown) => void;

export interface DevOverlayMiddlewareOptions {
  contextMode: ContextMode;
  defaultLocale: string;
  glossary: Record<string, Record<string, string>>;
  invalidateMessages: () => void;
  locales: string[];
  localesDir: string;
  messageRegistry: Map<string, MessageEntry>;
  projectRoot: string;
  provider: Provider | undefined;
  voice: string;
}

export function createDevOverlayMiddleware(
  options: DevOverlayMiddlewareOptions,
): (req: IncomingMessage, res: ServerResponse, next: Next) => void {
  const store = createTranslationStore({
    localesDir: options.localesDir,
    projectRoot: options.projectRoot,
  });

  return async (req, res, next) => {
    const url = req.url ?? '';
    if (!url.startsWith('/.yapyak/')) {
      next();
      return;
    }

    const path = url.split('?')[0] ?? url;

    try {
      if (req.method === 'GET' && path === '/.yapyak/messages') {
        sendJson(res, 200, listMessages(options));
        return;
      }

      const showMatch = path.match(/^\/\.yapyak\/messages\/([0-9a-f]+)$/);
      if (req.method === 'GET' && showMatch?.[1]) {
        const message = showMessage(showMatch[1], options, store);
        if (!message) {
          sendJson(res, 404, { error: 'Message not found' });
          return;
        }
        sendJson(res, 200, message);
        return;
      }

      const translationMatch = path.match(
        /^\/\.yapyak\/messages\/([0-9a-f]+)\/translations\/([a-zA-Z0-9_-]+)$/,
      );
      if (
        req.method === 'PATCH' &&
        translationMatch?.[1] &&
        translationMatch?.[2]
      ) {
        const hash = translationMatch[1];
        const locale = translationMatch[2];
        const entry = options.messageRegistry.get(hash);
        if (!entry) {
          sendJson(res, 404, { error: 'Message not found' });
          return;
        }
        if (!options.locales.includes(locale)) {
          sendJson(res, 422, { error: `Unknown locale: ${locale}` });
          return;
        }
        const body = await readJsonBody(req);
        const value = body?.value;
        if (typeof value !== 'string') {
          sendJson(res, 422, { error: 'Body requires { value: string }' });
          return;
        }
        store.write(locale, entry.fileId, entry.source, value);
        options.invalidateMessages();
        sendJson(res, 200, showMessage(hash, options, store));
        return;
      }

      if (
        req.method === 'DELETE' &&
        translationMatch?.[1] &&
        translationMatch?.[2]
      ) {
        const hash = translationMatch[1];
        const locale = translationMatch[2];
        const entry = options.messageRegistry.get(hash);
        if (!entry) {
          sendJson(res, 404, { error: 'Message not found' });
          return;
        }
        const removed = store.delete(locale, entry.fileId, entry.source);
        if (removed) {
          options.invalidateMessages();
        }
        sendJson(res, 204, null);
        return;
      }

      const regenerateMatch = path.match(
        /^\/\.yapyak\/messages\/([0-9a-f]+)\/translations\/([a-zA-Z0-9_-]+)\/regenerate$/,
      );
      if (
        req.method === 'POST' &&
        regenerateMatch?.[1] &&
        regenerateMatch?.[2]
      ) {
        const hash = regenerateMatch[1];
        const locale = regenerateMatch[2];
        const entry = options.messageRegistry.get(hash);
        if (!entry) {
          sendJson(res, 404, { error: 'Message not found' });
          return;
        }
        if (!options.locales.includes(locale)) {
          sendJson(res, 422, { error: `Unknown locale: ${locale}` });
          return;
        }
        if (!options.provider) {
          sendJson(res, 503, {
            error:
              'AI provider not configured. Set ai.provider in plugin options.',
          });
          return;
        }
        const value = await regenerateTranslation({
          contextMode: options.contextMode,
          entry,
          glossary: options.glossary,
          locale,
          provider: options.provider,
          voice: options.voice,
        });
        store.write(locale, entry.fileId, entry.source, value);
        options.invalidateMessages();
        sendJson(res, 200, showMessage(hash, options, store));
        return;
      }

      sendJson(res, 404, { error: 'Not found' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sendJson(res, 500, { error: message });
    }
  };
}

function listMessages(options: DevOverlayMiddlewareOptions): unknown {
  const entries = [...options.messageRegistry.values()];
  return entries
    .map((entry) => ({
      componentName: entry.componentName ?? '',
      fileId: entry.fileId,
      hash: entry.hash,
      source: entry.source,
    }))
    .sort((a, b) => {
      const fileCmp = a.fileId.localeCompare(b.fileId);
      if (fileCmp !== 0) return fileCmp;
      return a.source.localeCompare(b.source);
    });
}

function showMessage(
  hash: string,
  options: DevOverlayMiddlewareOptions,
  store: TranslationStore,
): unknown | undefined {
  const entry = options.messageRegistry.get(hash);
  if (!entry) {
    return undefined;
  }
  return {
    componentName: entry.componentName ?? '',
    fileId: entry.fileId,
    hash: entry.hash,
    snippet: entry.snippet ?? '',
    source: entry.source,
    translations: store.readAll(options.locales, entry.fileId, entry.source),
  };
}

async function readJsonBody(
  req: IncomingMessage,
): Promise<{ value?: unknown }> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (raw.length === 0) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  if (status === 204) {
    res.end();
    return;
  }
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}
