export interface TransformSourceOptions {
  bareNames?: ReadonlySet<string>;
  code: string;
  factoryNames: ReadonlySet<string>;
  fileId: string;
}

export interface TransformSourceResult {
  code: string;
  count: number;
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
    return { code, count: 0 };
  }

  const callPositions: { callStart: number; matchEnd: number }[] = [];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null = pattern.exec(code);
    while (match !== null) {
      callPositions.push({
        callStart: match.index + match[0].length,
        matchEnd: match.index + match[0].length,
      });
      match = pattern.exec(code);
    }
  }

  callPositions.sort((a, b) => a.callStart - b.callStart);

  let count = 0;
  let result = '';
  let lastIndex = 0;

  for (const { callStart } of callPositions) {
    if (callStart < lastIndex) {
      continue;
    }
    const argsRange = sliceArguments(code, callStart);
    if (!argsRange) {
      continue;
    }
    const { argsEnd, args } = argsRange;
    const newArgs = injectFileId(args, fileId);
    result += code.slice(lastIndex, callStart - 1);
    result += newArgs;
    lastIndex = argsEnd;
    count++;
  }

  result += code.slice(lastIndex);
  return { code: result, count };
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

function injectFileId(args: string, fileId: string): string {
  const trimmed = args.trim();
  const fileIdLiteral = JSON.stringify(fileId);

  if (trimmed === '') {
    return `(${fileIdLiteral})`;
  }

  const argsList = splitTopLevelArgs(args);
  while (argsList.length < 2) {
    argsList.push('undefined');
  }

  if (argsList.length >= 3) {
    argsList[2] = fileIdLiteral;
  } else {
    argsList.push(fileIdLiteral);
  }

  return `(${argsList.join(', ')})`;
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
