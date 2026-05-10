import { deriveComponentName } from './derive-component-name.js';
import { extractSnippet } from './extract-snippet.js';
import { DynamicSourceError, parseSourceArg } from './parse-source-arg.js';
import {
  locate,
  sliceArguments,
  splitTopLevelArgs,
} from './slice-arguments.js';

export interface MessageContext {
  componentName: string;
  enclosingElement: string | undefined;
  snippet: string;
}

export interface ExtractedMessage {
  column: number;
  context: MessageContext;
  fileId: string;
  fixedLocale: string | undefined;
  line: number;
  source: string;
}

export interface ExtractMessagesOptions {
  code: string;
  fileId: string;
}

export class DynamicMessageError extends DynamicSourceError {}

export function extractMessages(
  options: ExtractMessagesOptions,
): ExtractedMessage[] {
  const { code, fileId } = options;
  const aliases = collectAliases(code);
  if (aliases.size === 0) {
    return [];
  }
  const callSites = findCallSites(code, aliases);
  const componentName = deriveComponentName(fileId);
  const messages: ExtractedMessage[] = [];

  for (const site of callSites) {
    const argsRange = sliceArguments(code, site.argsStart);
    if (argsRange === undefined) {
      continue;
    }
    const argList = splitTopLevelArgs(argsRange.args);
    const firstArg = argList[0];
    const position = locate(code, site.callStart);
    if (firstArg === undefined) {
      throw new DynamicSourceError(
        't() called with no arguments',
        fileId,
        position,
      );
    }
    let source: string;
    try {
      source = parseSourceArg(firstArg);
    } catch (error) {
      if (error instanceof DynamicSourceError) {
        throw new DynamicSourceError(error.message, fileId, position);
      }
      throw error;
    }
    messages.push({
      column: position.column,
      context: {
        componentName,
        enclosingElement: findEnclosingElement(code, site.callStart),
        snippet: extractSnippet({ code, line: position.line }),
      },
      fileId,
      fixedLocale: site.fixedLocale,
      line: position.line,
      source,
    });
  }
  return messages;
}

interface CallSite {
  argsStart: number;
  callEnd: number;
  callStart: number;
  fixedLocale: string | undefined;
}

interface AliasInfo {
  name: string;
}

function collectAliases(code: string): Set<string> {
  const aliases = new Set<string>();
  const importRe =
    /import\s*(?:type\s+)?\{\s*([^}]+)\s*\}\s*from\s*(['"])(yapyak(?:\/[^'"]+)?)\2/g;
  let match: RegExpExecArray | null = importRe.exec(code);
  while (match !== null) {
    const inside = match[1];
    if (inside !== undefined) {
      for (const part of inside.split(',')) {
        const aliasName = parseImportSpecifier(part);
        if (aliasName !== null) {
          aliases.add(aliasName);
        }
      }
    }
    match = importRe.exec(code);
  }
  return aliases;
}

function parseImportSpecifier(part: string): string | null {
  const trimmed = part.trim();
  if (trimmed === '') {
    return null;
  }
  const asMatch = trimmed.match(/^(\w+)\s+as\s+(\w+)$/);
  if (asMatch !== null) {
    const original = asMatch[1];
    const alias = asMatch[2];
    if (original === 't' && alias !== undefined) {
      return alias;
    }
    return null;
  }
  if (trimmed === 't') {
    return 't';
  }
  return null;
}

function findCallSites(code: string, aliases: Set<string>): CallSite[] {
  if (aliases.size === 0) {
    return [];
  }
  const sites: CallSite[] = [];
  const aliasUnion = [...aliases].map(escapeRegex).join('|');
  const directRe = new RegExp(
    `(?<![\\w.$])(?:${aliasUnion})\\s*\\(`,
    'g',
  );
  let match: RegExpExecArray | null = directRe.exec(code);
  while (match !== null) {
    sites.push({
      argsStart: match.index + match[0].length,
      callEnd: -1,
      callStart: match.index,
      fixedLocale: undefined,
    });
    match = directRe.exec(code);
  }

  const localeRe = new RegExp(
    `(?<![\\w.$])(?:${aliasUnion})\\s*\\.\\s*in\\s*\\(\\s*(['"])([^'"]+)\\1\\s*\\)\\s*\\(`,
    'g',
  );
  let localeMatch: RegExpExecArray | null = localeRe.exec(code);
  while (localeMatch !== null) {
    const fixedLocale = localeMatch[2];
    if (fixedLocale !== undefined) {
      sites.push({
        argsStart: localeMatch.index + localeMatch[0].length,
        callEnd: -1,
        callStart: localeMatch.index,
        fixedLocale,
      });
    }
    localeMatch = localeRe.exec(code);
  }

  return dedupeAndOrder(sites);
}

function dedupeAndOrder(sites: CallSite[]): CallSite[] {
  const seen = new Set<number>();
  const ordered = sites.sort((a, b) => a.callStart - b.callStart);
  const out: CallSite[] = [];
  for (const site of ordered) {
    if (seen.has(site.callStart)) {
      continue;
    }
    seen.add(site.callStart);
    out.push(site);
  }
  return out;
}

function findEnclosingElement(code: string, position: number): string | undefined {
  let depth = 0;
  let i = position;
  while (i > 0) {
    i--;
    const ch = code[i];
    if (ch === '>') {
      const prev = code[i - 1];
      if (prev === '/') {
        depth++;
      }
      continue;
    }
    if (ch === '<') {
      const next = code[i + 1];
      if (next === '/') {
        depth++;
        continue;
      }
      if (next === '!' || next === '?') {
        continue;
      }
      if (depth > 0) {
        depth--;
        continue;
      }
      const tag = readTagName(code, i + 1);
      if (tag !== null) {
        return tag;
      }
      return undefined;
    }
  }
  return undefined;
}

function readTagName(code: string, start: number): string | null {
  let i = start;
  let name = '';
  while (i < code.length) {
    const ch = code[i];
    if (ch === undefined) {
      break;
    }
    if (
      (ch >= 'a' && ch <= 'z') ||
      (ch >= 'A' && ch <= 'Z') ||
      (ch >= '0' && ch <= '9') ||
      ch === '-' ||
      ch === '_' ||
      ch === '.'
    ) {
      name += ch;
      i++;
      continue;
    }
    break;
  }
  return name === '' ? null : name;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
