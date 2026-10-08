import type {
  Expression,
  ExpressionStatement,
  Node,
  OxcError,
  ParserOptions,
  Program,
} from 'oxc-parser';
import type { Fragment } from '../../processor';

import { parseSync } from 'oxc-parser';

import { collectChildren } from './child';
import { collectLineStarts } from './position';
import { basename } from 'node:path';

export type SourceFile = {
  code: string;
  fatalError?: OxcError;
  fileId: string;
  lang: NonNullable<ParserOptions['lang']>;
  lineStarts: number[];
  program: Program;
};

export function parseSourceFile(
  fileId: string,
  fragment: Pick<Fragment, 'code' | 'language' | 'type'>,
): SourceFile {
  const lang = resolveLang(fileId, fragment.language);
  const parsed = parseProgram(fileId, fragment, lang);
  setParents(parsed.program);
  return {
    ...parsed,
    code: fragment.code,
    fileId,
    lang,
    lineStarts: collectLineStarts(fragment.code),
  };
}

function resolveLang(
  fileId: string,
  language: Fragment['language'],
): SourceFile['lang'] {
  if (fileId.endsWith('.tsx')) {
    return 'tsx';
  }
  if (fileId.endsWith('.jsx')) {
    return 'jsx';
  }
  if (language === 'tsx') {
    return 'tsx';
  }
  if (language === 'js') {
    return 'jsx';
  }
  if (isDeclarationFile(fileId)) {
    return 'dts';
  }
  return 'ts';
}

function isDeclarationFile(fileId: string): boolean {
  return (
    fileId.endsWith('.d.mts') ||
    fileId.endsWith('.d.cts') ||
    (fileId.endsWith('.ts') && basename(fileId).includes('.d.'))
  );
}

function parseProgram(
  fileId: string,
  fragment: Pick<Fragment, 'code' | 'type'>,
  lang: SourceFile['lang'],
): Pick<SourceFile, 'fatalError' | 'program'> {
  const { errors, program } = parseSync(fileId, fragment.code, {
    lang,
    sourceType: 'module',
  });
  const fatalError = program.body.length === 0 ? errors[0] : undefined;
  if (fatalError === undefined) {
    return {
      program,
    };
  }
  const expressionProgram =
    fragment.type === 'script'
      ? undefined
      : parseExpressionProgram(fileId, fragment.code, lang);
  return expressionProgram === undefined
    ? {
        fatalError,
        program,
      }
    : {
        program: expressionProgram,
      };
}

function parseExpressionProgram(
  fileId: string,
  code: string,
  lang: SourceFile['lang'],
): Program | undefined {
  const wrappedCode = `(${code}\n)`;
  const { program } = parseSync(fileId, wrappedCode, {
    lang,
    sourceType: 'module',
  });
  const [statement] = program.body;
  if (
    statement?.type === 'ExpressionStatement' &&
    statement.expression.type === 'ParenthesizedExpression' &&
    statement.expression.end === wrappedCode.length
  ) {
    const expressionStatement: ExpressionStatement = statement;
    const { expression } = statement.expression;
    remapSpans(expression, -1);
    expressionStatement.expression = expression;
    expressionStatement.start = 0;
    expressionStatement.end = code.length;
    program.start = 0;
    program.end = code.length;
    return program;
  }
  return undefined;
}

function remapSpans(expression: Expression, delta: number): void {
  const stack: Node[] = [
    expression,
  ];
  let node = stack.pop();
  while (node) {
    node.start += delta;
    node.end += delta;
    stack.push(...collectChildren(node));
    node = stack.pop();
  }
}

function setParents(program: Program): void {
  const stack: Node[] = [
    program,
  ];
  let node = stack.pop();
  while (node) {
    for (const child of collectChildren(node)) {
      child.parent = node;
      stack.push(child);
    }
    node = stack.pop();
  }
}
