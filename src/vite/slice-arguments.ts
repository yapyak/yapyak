export interface ArgsRange {
  args: string;
  argsEnd: number;
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
