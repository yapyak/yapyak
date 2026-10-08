import type { Directive, Program, Statement } from 'oxc-parser';

export function resolveDirectivePrologueEnd(
  program: Program,
  source: string,
): number {
  const directives = extractPrologueStatements(program);
  const last = directives[directives.length - 1];
  if (last === undefined) {
    return 0;
  }
  return resolveLineEndAfter(source, last.end);
}

export function extractPrologueDirectives(program: Program): string[] {
  return extractPrologueStatements(program).map(
    (statement) => statement.expression.value,
  );
}

function extractPrologueStatements(program: Program): Directive[] {
  const directives: Directive[] = [];
  for (const statement of program.body) {
    if (!isPrologueDirective(statement)) {
      break;
    }
    directives.push(statement);
  }
  return directives;
}

function isPrologueDirective(
  statement: Directive | Statement,
): statement is Directive {
  return (
    statement.type === 'ExpressionStatement' &&
    typeof statement.directive === 'string'
  );
}

function resolveLineEndAfter(source: string, position: number): number {
  let cursor = position;
  while (cursor < source.length) {
    const character = source[cursor];
    if (character === ' ' || character === '\t' || character === ';') {
      cursor += 1;
      continue;
    }
    if (character === '/' && source[cursor + 1] === '/') {
      const newline = source.indexOf('\n', cursor);
      if (newline === -1) {
        return source.length;
      }
      cursor = newline;
      continue;
    }
    if (character === '/' && source[cursor + 1] === '*') {
      const close = source.indexOf('*/', cursor + 2);
      if (close === -1) {
        return source.length;
      }
      cursor = close + 2;
      continue;
    }
    if (character === '\r') {
      cursor += 1;
      if (source[cursor] === '\n') {
        cursor += 1;
      }
      return cursor;
    }
    if (character === '\n') {
      return cursor + 1;
    }
    return cursor;
  }
  return cursor;
}
