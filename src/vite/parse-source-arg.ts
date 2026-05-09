export interface ParsedSource {
  source: string;
}

export class DynamicSourceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DynamicSourceError';
  }
}

export function parseSourceArg(rawArg: string): ParsedSource {
  const trimmed = rawArg.trim();
  if (trimmed.length === 0) {
    throw new DynamicSourceError('empty source argument');
  }

  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];

  if (first === "'" || first === '"') {
    if (last !== first) {
      throw new DynamicSourceError(
        `source argument is not a string literal: ${trimmed}`,
      );
    }
    return { source: unescapeString(trimmed.slice(1, -1)) };
  }

  if (first === '`') {
    if (last !== '`') {
      throw new DynamicSourceError(
        `source argument is not a string literal: ${trimmed}`,
      );
    }
    const body = trimmed.slice(1, -1);
    if (containsTemplateInterpolation(body)) {
      throw new DynamicSourceError(
        `source argument uses template interpolation; t() requires a static string literal`,
      );
    }
    return { source: unescapeString(body) };
  }

  throw new DynamicSourceError(
    `source argument must be a string literal, got: ${trimmed.slice(0, 60)}`,
  );
}

function containsTemplateInterpolation(body: string): boolean {
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
