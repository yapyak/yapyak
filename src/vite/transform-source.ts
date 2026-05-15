import { DynamicSourceError, parseSourceArg } from './parse-source-arg';
import {
  locate,
  sliceArguments,
  splitTopLevelArgs,
} from './slice-arguments';

export interface LocaleData {
  [locale: string]: {
    [fileId: string]: { [source: string]: string };
  };
}

export interface TransformOptions {
  defaultLocale: string;
  fileId: string;
  helperImport?: string;
  localeData: LocaleData;
  locales: string[];
}

export interface TransformResult {
  code: string;
}

const HELPER_NAME = '_$pick';
const DEFAULT_HELPER_IMPORT = 'yapyak/internal';

interface CallSite {
  argsStart: number;
  callEnd: number;
  callStart: number;
  fixedLocale: string | undefined;
}

export function transformSource(
  code: string,
  options: TransformOptions,
): TransformResult | null {
  const aliases = collectAliases(code);
  if (aliases.size === 0) {
    return null;
  }
  const sites = findCallSites(code, aliases);
  if (sites.length === 0) {
    return null;
  }

  const replacements: Array<{
    end: number;
    replacement: string;
    start: number;
  }> = [];

  for (const site of sites) {
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
        options.fileId,
        position,
      );
    }
    let source: string;
    try {
      source = parseSourceArg(firstArg);
    } catch (error) {
      if (error instanceof DynamicSourceError) {
        throw new DynamicSourceError(error.message, options.fileId, position);
      }
      throw error;
    }
    const paramsArg = argList[1];
    const compiled = compileCall(
      {
        fixedLocale: site.fixedLocale,
        paramsExpression: paramsArg,
        source,
      },
      options,
    );
    replacements.push({
      end: argsRange.argsEnd,
      replacement: compiled,
      start: site.callStart,
    });
  }

  if (replacements.length === 0) {
    return null;
  }

  const helperImport = options.helperImport ?? DEFAULT_HELPER_IMPORT;
  const importStatement = `import { pick as ${HELPER_NAME} } from '${helperImport}';`;
  const transformed = applyReplacements(code, replacements);
  return { code: injectImport(transformed, importStatement) };
}

function applyReplacements(
  code: string,
  replacements: Array<{ end: number; replacement: string; start: number }>,
): string {
  const sorted = [...replacements].sort((a, b) => b.start - a.start);
  let next = code;
  for (const r of sorted) {
    next = `${next.slice(0, r.start)}${r.replacement}${next.slice(r.end)}`;
  }
  return next;
}

function injectImport(code: string, importStatement: string): string {
  const match = code.match(/<script\b[^>]*>/i);
  if (match !== null && match.index !== undefined) {
    const insertAt = match.index + match[0].length;
    return `${code.slice(0, insertAt)}\n${importStatement}${code.slice(insertAt)}`;
  }
  return `${importStatement}\n${code}`;
}

interface CompileInput {
  fixedLocale: string | undefined;
  paramsExpression: string | undefined;
  source: string;
}

function compileCall(input: CompileInput, options: TransformOptions): string {
  const variants: Record<string, string> = {};
  for (const locale of options.locales) {
    const value = readLocaleValue(
      options.localeData,
      locale,
      options.fileId,
      input.source,
    );
    variants[locale] = value ?? input.source;
  }
  const variantsLiteral = stringifyVariants(variants);
  const args: string[] = [variantsLiteral];
  if (input.paramsExpression !== undefined || input.fixedLocale !== undefined) {
    args.push(input.paramsExpression ?? 'undefined');
  }
  if (input.fixedLocale !== undefined) {
    args.push(JSON.stringify(input.fixedLocale));
  }
  return `${HELPER_NAME}(${args.join(', ')})`;
}

function stringifyVariants(variants: Record<string, string>): string {
  const parts: string[] = [];
  for (const [locale, value] of Object.entries(variants)) {
    parts.push(`${quoteIdentifier(locale)}: ${singleQuoteString(value)}`);
  }
  return `{ ${parts.join(', ')} }`;
}

function quoteIdentifier(value: string): string {
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value)) {
    return value;
  }
  return singleQuoteString(value);
}

function singleQuoteString(value: string): string {
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
    .replace(/\}/g, '\\u007D');
  return `'${escaped}'`;
}

function readLocaleValue(
  data: LocaleData,
  locale: string,
  fileId: string,
  source: string,
): string | undefined {
  const localeFile = data[locale];
  if (localeFile === undefined) {
    return undefined;
  }
  const fileEntries = localeFile[fileId];
  if (fileEntries === undefined) {
    return undefined;
  }
  const value = fileEntries[source];
  if (typeof value !== 'string' || value === '') {
    return undefined;
  }
  return value;
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
  const directRe = new RegExp(`(?<![\\w.$])(?:${aliasUnion})\\s*\\(`, 'g');
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

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
