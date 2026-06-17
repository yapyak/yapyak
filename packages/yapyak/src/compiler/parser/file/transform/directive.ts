import ts from 'typescript';

export function resolveDirectivePrologueEnd(source: string): number {
  const directives = extractPrologueStatements(source);
  const last = directives[directives.length - 1];
  if (last === undefined) {
    return 0;
  }
  return resolveLineEndAfter(source, last.end);
}

export function extractPrologueDirectives(source: string): string[] {
  return extractPrologueStatements(source).map(
    (statement) => (statement.expression as ts.StringLiteral).text,
  );
}

function extractPrologueStatements(source: string): ts.ExpressionStatement[] {
  const sourceFile = ts.createSourceFile(
    '__directive.ts',
    source,
    ts.ScriptTarget.Latest,
    false,
  );
  const directives: ts.ExpressionStatement[] = [];
  for (const statement of sourceFile.statements) {
    if (!isPrologueDirective(statement)) {
      break;
    }
    directives.push(statement);
  }
  return directives;
}

function isPrologueDirective(
  node: ts.Statement,
): node is ts.ExpressionStatement {
  return ts.isExpressionStatement(node) && ts.isStringLiteral(node.expression);
}

function resolveLineEndAfter(source: string, position: number): number {
  let cursor = position;
  while (cursor < source.length) {
    const char = source[cursor];
    if (char === ' ' || char === '\t' || char === ';') {
      cursor += 1;
      continue;
    }
    if (char === '/' && source[cursor + 1] === '/') {
      const newline = source.indexOf('\n', cursor);
      if (newline === -1) {
        return source.length;
      }
      cursor = newline;
      continue;
    }
    if (char === '/' && source[cursor + 1] === '*') {
      const close = source.indexOf('*/', cursor + 2);
      if (close === -1) {
        return source.length;
      }
      cursor = close + 2;
      continue;
    }
    if (char === '\r') {
      cursor += 1;
      if (source[cursor] === '\n') {
        cursor += 1;
      }
      return cursor;
    }
    if (char === '\n') {
      return cursor + 1;
    }
    return cursor;
  }
  return cursor;
}
