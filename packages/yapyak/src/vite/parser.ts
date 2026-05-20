export interface CallSite {
  argsStart: number;
  callEnd: number;
  callStart: number;
  fixedLocale: string | undefined;
}

export interface ArgsRange {
  args: string;
  argsEnd: number;
}

export interface ExtractSnippetOptions {
  code: string;
  line: number;
  radius?: number;
}

export class DynamicSourceError extends Error {
  fileId: string;
  position: { column: number; line: number };

  constructor(
    message: string,
    fileId: string,
    position: { column: number; line: number },
  ) {
    super(`yapyak: ${message} (${fileId}:${position.line}:${position.column})`);
    this.fileId = fileId;
    this.position = position;
    this.name = 'DynamicSourceError';
  }
}

export function findCallSites(code: string): CallSite[] {
  const aliases = collectAliases(code);
  if (aliases.size === 0) {
    return [];
  }
  const sites: CallSite[] = [];
  const aliasUnion = [...aliases].map(escapeRegex).join('|');
  const scannable = maskInactiveRegions(code);

  const directRx = new RegExp(`(?<![\\w.$])(?:${aliasUnion})\\s*\\(`, 'g');
  let match: RegExpExecArray | null = directRx.exec(scannable);
  while (match !== null) {
    sites.push({
      argsStart: match.index + match[0].length,
      callEnd: -1,
      callStart: match.index,
      fixedLocale: undefined,
    });
    match = directRx.exec(scannable);
  }

  const localeRx = new RegExp(
    `(?<![\\w.$])(?:${aliasUnion})\\s*\\.\\s*in\\s*\\(\\s*(['"])([^'"]+)\\1\\s*\\)\\s*\\(`,
    'g',
  );
  let localeMatch: RegExpExecArray | null = localeRx.exec(scannable);
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
    localeMatch = localeRx.exec(scannable);
  }

  return dedupeAndOrder(sites);
}

export function sliceArguments(
  code: string,
  start: number,
): ArgsRange | undefined {
  let depth = 1;
  let inString: string | undefined;
  let inTemplate = false;
  let templateBraceDepth = 0;
  const templateBraceStack: number[] = [];
  let i = start;

  while (i < code.length) {
    const ch = code[i];
    const prev = i > 0 ? code[i - 1] : '';

    if (inString !== undefined) {
      if (ch === inString && prev !== '\\') {
        inString = undefined;
      }
      i++;
      continue;
    }

    if (inTemplate) {
      if (ch === '`' && prev !== '\\') {
        inTemplate = false;
        i++;
        continue;
      }
      if (ch === '$' && code[i + 1] === '{') {
        templateBraceStack.push(templateBraceDepth);
        templateBraceDepth = 1;
        i += 2;
        continue;
      }
      if (templateBraceDepth > 0) {
        if (ch === '{') {
          templateBraceDepth++;
        } else if (ch === '}') {
          templateBraceDepth--;
          if (templateBraceDepth === 0) {
            templateBraceDepth = templateBraceStack.pop() ?? 0;
          }
        }
      }
      i++;
      continue;
    }

    if (ch === "'" || ch === '"') {
      inString = ch;
      i++;
      continue;
    }
    if (ch === '`') {
      inTemplate = true;
      i++;
      continue;
    }
    if (ch === '(' || ch === '[' || ch === '{') {
      depth++;
    } else if (ch === ')' || ch === ']' || ch === '}') {
      depth--;
      if (depth === 0 && ch === ')') {
        return {
          args: code.slice(start, i),
          argsEnd: i + 1,
        };
      }
    }
    i++;
  }

  return undefined;
}

export function splitTopLevelArgs(args: string): string[] {
  const result: string[] = [];
  let depth = 0;
  let inString: string | undefined;
  let inTemplate = false;
  let templateBraceDepth = 0;
  const templateBraceStack: number[] = [];
  let start = 0;

  for (let i = 0; i < args.length; i++) {
    const ch = args[i];
    const prev = i > 0 ? args[i - 1] : '';

    if (inString !== undefined) {
      if (ch === inString && prev !== '\\') {
        inString = undefined;
      }
      continue;
    }

    if (inTemplate) {
      if (ch === '`' && prev !== '\\') {
        inTemplate = false;
        continue;
      }
      if (ch === '$' && args[i + 1] === '{') {
        templateBraceStack.push(templateBraceDepth);
        templateBraceDepth = 1;
        i++;
        continue;
      }
      if (templateBraceDepth > 0) {
        if (ch === '{') {
          templateBraceDepth++;
        } else if (ch === '}') {
          templateBraceDepth--;
          if (templateBraceDepth === 0) {
            templateBraceDepth = templateBraceStack.pop() ?? 0;
          }
        }
      }
      continue;
    }

    if (ch === "'" || ch === '"') {
      inString = ch;
      continue;
    }
    if (ch === '`') {
      inTemplate = true;
      continue;
    }
    if (ch === '(' || ch === '[' || ch === '{') {
      depth++;
    } else if (ch === ')' || ch === ']' || ch === '}') {
      depth--;
    } else if (ch === ',' && depth === 0) {
      result.push(args.slice(start, i).trim());
      start = i + 1;
    }
  }

  const last = args.slice(start).trim();
  if (last !== '') {
    result.push(last);
  }

  return result;
}

export function locate(
  code: string,
  offset: number,
): { column: number; line: number } {
  let line = 1;
  let column = 1;
  for (let i = 0; i < offset; i++) {
    if (code[i] === '\n') {
      line++;
      column = 1;
    } else {
      column++;
    }
  }
  return { column, line };
}

export function parseSourceArg(rawArg: string): string {
  const trimmed = rawArg.trim();
  if (trimmed.length === 0) {
    throw new DynamicSourceError('t() called with no arguments', '', {
      column: 0,
      line: 0,
    });
  }

  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];

  if (first === "'" || first === '"') {
    if (last !== first) {
      throw new DynamicSourceError(
        `t() first argument is not a closed string literal: ${preview(trimmed)}`,
        '',
        { column: 0, line: 0 },
      );
    }
    return unescapeString(trimmed.slice(1, -1));
  }

  if (first === '`') {
    if (last !== '`') {
      throw new DynamicSourceError(
        `t() first argument is not a closed string literal: ${preview(trimmed)}`,
        '',
        { column: 0, line: 0 },
      );
    }
    const body = trimmed.slice(1, -1);
    if (hasTemplateInterpolation(body)) {
      throw new DynamicSourceError(
        't() first argument must be a static string literal; template interpolation is not allowed',
        '',
        { column: 0, line: 0 },
      );
    }
    return unescapeString(body);
  }

  throw new DynamicSourceError(
    `t() first argument must be a string literal, got: ${preview(trimmed)}`,
    '',
    { column: 0, line: 0 },
  );
}

export function extractSnippet(options: ExtractSnippetOptions): string {
  const { code, line, radius = 3 } = options;
  const lines = code.split('\n');
  const start = Math.max(0, line - 1 - radius);
  const end = Math.min(lines.length, line + radius);
  const slice = lines.slice(start, end);
  const indent = getMinimumIndent(slice);
  return slice.map((row) => row.slice(indent)).join('\n');
}

export function deriveComponentName(fileId: string): string {
  const segments = fileId.split('/');
  let basename = segments[segments.length - 1] ?? '';
  basename = basename.replace(/\.[^.]+$/, '');

  if (basename === 'index' || basename === '') {
    basename = segments[segments.length - 2] ?? basename;
  }

  basename = basename.replace(/^\$/, '');
  basename = basename.replace(/^[._]+/, '');

  if (basename === '') {
    return '';
  }

  return basename
    .split(/[-_]/)
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

type Mode = 'code' | 'interp' | 'string' | 'template';

function maskInactiveRegions(code: string): string {
  const chars = code.split('');
  const stack: { braceDepth: number; mode: Mode; quote: string | undefined }[] =
    [{ braceDepth: 0, mode: 'code', quote: undefined }];
  let i = 0;

  while (i < code.length) {
    const state = stack[stack.length - 1] as (typeof stack)[number];
    const ch = code[i] as string;

    if (state.mode === 'code' || state.mode === 'interp') {
      if (ch === '/' && code[i + 1] === '/') {
        const newline = code.indexOf('\n', i);
        const stop = newline === -1 ? code.length : newline;
        for (let k = i; k < stop; k++) {
          chars[k] = ' ';
        }
        i = stop;
        continue;
      }
      if (ch === '/' && code[i + 1] === '*') {
        const closing = code.indexOf('*/', i + 2);
        const stop = closing === -1 ? code.length : closing + 2;
        for (let k = i; k < stop; k++) {
          if (chars[k] !== '\n') {
            chars[k] = ' ';
          }
        }
        i = stop;
        continue;
      }
      if (ch === "'" || ch === '"') {
        stack.push({ braceDepth: 0, mode: 'string', quote: ch });
        i++;
        continue;
      }
      if (ch === '`') {
        stack.push({ braceDepth: 0, mode: 'template', quote: undefined });
        i++;
        continue;
      }
      if (state.mode === 'interp') {
        if (ch === '{') {
          state.braceDepth++;
        } else if (ch === '}') {
          state.braceDepth--;
          if (state.braceDepth === 0) {
            stack.pop();
            i++;
            continue;
          }
        }
      }
      i++;
      continue;
    }

    if (state.mode === 'string') {
      if (ch === '\\') {
        chars[i] = ' ';
        if (i + 1 < code.length && code[i + 1] !== '\n') {
          chars[i + 1] = ' ';
        }
        i += 2;
        continue;
      }
      if (ch === state.quote) {
        stack.pop();
        i++;
        continue;
      }
      if (ch !== '\n') {
        chars[i] = ' ';
      }
      i++;
      continue;
    }

    if (state.mode === 'template') {
      if (ch === '\\') {
        chars[i] = ' ';
        if (i + 1 < code.length && code[i + 1] !== '\n') {
          chars[i + 1] = ' ';
        }
        i += 2;
        continue;
      }
      if (ch === '`') {
        stack.pop();
        i++;
        continue;
      }
      if (ch === '$' && code[i + 1] === '{') {
        stack.push({ braceDepth: 1, mode: 'interp', quote: undefined });
        i += 2;
        continue;
      }
      if (ch !== '\n') {
        chars[i] = ' ';
      }
      i++;
    }
  }

  return chars.join('');
}

function collectAliases(code: string): Set<string> {
  const aliases = new Set<string>();
  const importRx =
    /import\s*(?:type\s+)?\{\s*([^}]+)\s*\}\s*from\s*(['"])(yapyak(?:\/[^'"]+)?)\2/g;
  let match: RegExpExecArray | null = importRx.exec(code);
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
    match = importRx.exec(code);
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

function preview(value: string): string {
  return value.length <= 60 ? value : `${value.slice(0, 60)}…`;
}

function hasTemplateInterpolation(body: string): boolean {
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === '\\') {
      i++;
      continue;
    }
    if (ch === '$' && body[i + 1] === '{') {
      return true;
    }
  }
  return false;
}

function unescapeString(input: string): string {
  let result = '';
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch !== '\\') {
      result += ch;
      continue;
    }
    const next = input[i + 1];
    i++;
    switch (next) {
      case 'n':
        result += '\n';
        break;
      case 't':
        result += '\t';
        break;
      case 'r':
        result += '\r';
        break;
      case 'b':
        result += '\b';
        break;
      case 'f':
        result += '\f';
        break;
      case 'v':
        result += '\v';
        break;
      case '0':
        result += '\0';
        break;
      case '\\':
        result += '\\';
        break;
      case "'":
        result += "'";
        break;
      case '"':
        result += '"';
        break;
      case '`':
        result += '`';
        break;
      case 'x': {
        const hex = input.slice(i + 1, i + 3);
        if (/^[0-9a-fA-F]{2}$/.test(hex)) {
          result += String.fromCharCode(parseInt(hex, 16));
          i += 2;
        } else {
          result += next;
        }
        break;
      }
      case 'u': {
        if (input[i + 1] === '{') {
          const end = input.indexOf('}', i + 2);
          if (end !== -1) {
            const hex = input.slice(i + 2, end);
            if (/^[0-9a-fA-F]+$/.test(hex)) {
              result += String.fromCodePoint(parseInt(hex, 16));
              i = end;
              break;
            }
          }
          result += next;
          break;
        }
        const hex = input.slice(i + 1, i + 5);
        if (/^[0-9a-fA-F]{4}$/.test(hex)) {
          result += String.fromCharCode(parseInt(hex, 16));
          i += 4;
        } else {
          result += next;
        }
        break;
      }
      case '\n':
        break;
      default:
        result += next ?? '';
        break;
    }
  }
  return result;
}

function getMinimumIndent(rows: string[]): number {
  let min = Number.POSITIVE_INFINITY;
  for (const row of rows) {
    if (row.trim() === '') {
      continue;
    }
    const match = row.match(/^[ \t]*/);
    const width = match ? match[0].length : 0;
    if (width < min) {
      min = width;
    }
  }
  return Number.isFinite(min) ? min : 0;
}
