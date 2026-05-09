import { deriveComponentName } from '../compiler/derive-component-name.js';
import { extractSnippet } from '../compiler/extract-snippet.js';
import { messageHash } from './message-hash.js';
import { DynamicSourceError, parseSourceArg } from './parse-source-arg.js';

export interface TransformSourceOptions {
  bareNames?: ReadonlySet<string>;
  code: string;
  factoryNames: ReadonlySet<string>;
  fileId: string;
}

export interface CollectedMessage {
  componentName: string;
  fileId: string;
  hash: string;
  line: number;
  snippet: string;
  source: string;
}

export interface TransformSourceResult {
  code: string;
  count: number;
  messages: CollectedMessage[];
}

export function transformSource(
  options: TransformSourceOptions,
): TransformSourceResult {
  const { bareNames, code, factoryNames, fileId } = options;

  const patterns: RegExp[] = [];

  if (factoryNames.size > 0) {
    const factoryAlternatives = [...factoryNames].map(escapeRegex).join('|');
    patterns.push(new RegExp(`\\b(?:${factoryAlternatives})\\.t\\s*\\(`, 'g'));
  }

  if (bareNames && bareNames.size > 0) {
    const bareAlternatives = [...bareNames].map(escapeRegex).join('|');
    patterns.push(new RegExp(`(?<![\\w.])(?:${bareAlternatives})\\s*\\(`, 'g'));
  }

  if (patterns.length === 0) {
    return { code, count: 0, messages: [] };
  }

  const callPositions: { callKeywordStart: number; callStart: number }[] = [];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null = pattern.exec(code);
    while (match !== null) {
      callPositions.push({
        callKeywordStart: match.index,
        callStart: match.index + match[0].length,
      });
      match = pattern.exec(code);
    }
  }

  callPositions.sort((a, b) => a.callKeywordStart - b.callKeywordStart);

  const messages: CollectedMessage[] = [];
  const seen = new Set<string>();
  let count = 0;
  let result = '';
  let lastIndex = 0;

  for (const { callKeywordStart, callStart } of callPositions) {
    if (callKeywordStart < lastIndex) {
      continue;
    }
    const argsRange = sliceArguments(code, callStart);
    if (!argsRange) {
      continue;
    }
    const { argsEnd, args } = argsRange;
    const argList = splitTopLevelArgs(args);
    const firstArg = argList[0];
    if (firstArg === undefined) {
      throw new DynamicSourceError(`t() called with no arguments in ${fileId}`);
    }

    let source: string;
    try {
      source = parseSourceArg(firstArg).source;
    } catch (error) {
      if (error instanceof DynamicSourceError) {
        const lineCol = locate(code, callKeywordStart);
        throw new DynamicSourceError(
          `${error.message} (${fileId}:${lineCol.line}:${lineCol.column})`,
        );
      }
      throw error;
    }

    const hash = messageHash(fileId, source);
    if (!seen.has(hash)) {
      seen.add(hash);
      const lineCol = locate(code, callKeywordStart);
      messages.push({
        componentName: deriveComponentName(fileId),
        fileId,
        hash,
        line: lineCol.line,
        snippet: extractSnippet({ code, line: lineCol.line }),
        source,
      });
    }

    const paramsArg = argList[1];
    const replacement =
      paramsArg !== undefined && paramsArg.length > 0
        ? `_m_${hash}(${paramsArg})`
        : `_m_${hash}()`;

    result += code.slice(lastIndex, callKeywordStart);
    result += replacement;
    lastIndex = argsEnd;
    count++;
  }

  result += code.slice(lastIndex);

  if (messages.length > 0) {
    const importLine = `import { ${messages
      .map((m) => `_m_${m.hash}`)
      .join(', ')} } from 'yapyak/messages';\n`;
    result = importLine + result;
  }

  return { code: result, count, messages };
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function locate(
  code: string,
  offset: number,
): { line: number; column: number } {
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
  return { line, column };
}

interface ArgsRange {
  args: string;
  argsEnd: number;
}

function sliceArguments(code: string, start: number): ArgsRange | undefined {
  let depth = 1;
  let inString: string | undefined;
  let inTemplate = false;
  let templateDepth = 0;
  let i = start;

  while (i < code.length) {
    const ch = code[i];
    const prev = i > 0 ? code[i - 1] : '';

    if (inString) {
      if (ch === inString && prev !== '\\') {
        inString = undefined;
      }
      i++;
      continue;
    }

    if (inTemplate) {
      if (ch === '`' && prev !== '\\') {
        inTemplate = false;
      } else if (ch === '$' && code[i + 1] === '{') {
        templateDepth++;
        i += 2;
        continue;
      } else if (ch === '}' && templateDepth > 0) {
        templateDepth--;
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

function splitTopLevelArgs(args: string): string[] {
  const result: string[] = [];
  let depth = 0;
  let inString: string | undefined;
  let inTemplate = false;
  let templateDepth = 0;
  let start = 0;

  for (let i = 0; i < args.length; i++) {
    const ch = args[i];
    const prev = i > 0 ? args[i - 1] : '';

    if (inString) {
      if (ch === inString && prev !== '\\') {
        inString = undefined;
      }
      continue;
    }

    if (inTemplate) {
      if (ch === '`' && prev !== '\\') {
        inTemplate = false;
      } else if (ch === '$' && args[i + 1] === '{') {
        templateDepth++;
      } else if (ch === '}' && templateDepth > 0) {
        templateDepth--;
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
