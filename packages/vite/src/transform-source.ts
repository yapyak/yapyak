import type { LocaleData } from '@yapyak/compiler';

import {
  DynamicSourceError,
  findCallSites,
  locate,
  parseSourceArg,
  sliceArguments,
  splitTopLevelArgs,
} from '@yapyak/compiler';

export interface TransformSourceOptions {
  defaultLocale: string;
  fileId: string;
  helperImport?: string;
  localeData: LocaleData;
  locales: string[];
}

export interface TransformSourceResult {
  changed: boolean;
  code: string;
}

const HELPER_NAME = '_$pick';
const DEFAULT_HELPER_IMPORT = '@yapyak/core';

export function transformSource(
  code: string,
  options: TransformSourceOptions,
): TransformSourceResult {
  const sites = findCallSites(code);
  if (sites.length === 0) {
    return { changed: false, code };
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
        '$t() called with no arguments',
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
    const compiled = compileCall(
      {
        restExpressions: argList.slice(1),
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
    return { changed: false, code };
  }

  const helperImport = options.helperImport ?? DEFAULT_HELPER_IMPORT;
  const importStatement = `import { ${HELPER_NAME} } from '${helperImport}';`;
  const transformed = applyReplacements(code, replacements);
  return { changed: true, code: injectImport(transformed, importStatement) };
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
  restExpressions: string[];
  source: string;
}

function compileCall(
  input: CompileInput,
  options: TransformSourceOptions,
): string {
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
  const args: string[] = [variantsLiteral, ...input.restExpressions];
  return `${HELPER_NAME}(${args.join(', ')})`;
}

function stringifyVariants(variants: Record<string, string>): string {
  const parts: string[] = [];
  for (const [locale, value] of Object.entries(variants)) {
    parts.push(`${quoteIdentifier(locale)}: ${quoteString(value)}`);
  }
  return `{ ${parts.join(', ')} }`;
}

function quoteIdentifier(value: string): string {
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value)) {
    return value;
  }
  return quoteString(value);
}

function quoteString(value: string): string {
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(new RegExp(String.fromCharCode(0x2028), 'g'), '\\u2028')
    .replace(new RegExp(String.fromCharCode(0x2029), 'g'), '\\u2029')
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
