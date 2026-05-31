import type { CallSite } from './call';
import type { Diagnostic } from './diagnostic';

import * as ts from 'typescript';

import { createDiagnostic } from './diagnostic';
import { toRange } from './range';

const CHAINABLE_NAMES = new Set(['hint', 'maxLength', 'tag']);

export interface ParsedChainables {
  diagnostics: Diagnostic[];
  hint?: string;
  maxLength?: number;
  tag?: string;
}

export function getOuterChainableCall(
  tCall: ts.CallExpression,
): ts.CallExpression {
  let current: ts.CallExpression = tCall;
  while (true) {
    const parent = current.parent;
    if (!parent || !ts.isPropertyAccessExpression(parent)) {
      break;
    }
    if (parent.expression !== current) {
      break;
    }
    const grandparent = parent.parent;
    if (
      !grandparent ||
      !ts.isCallExpression(grandparent) ||
      grandparent.expression !== parent
    ) {
      break;
    }
    if (!CHAINABLE_NAMES.has(parent.name.text)) {
      break;
    }
    current = grandparent;
  }
  return current;
}

export function detectOrphanChainables(
  sourceFile: ts.SourceFile,
  validTCalls: ReadonlySet<ts.CallExpression>,
): Diagnostic[] {
  const fileText = sourceFile.text;
  const fileId = sourceFile.fileName;
  const diagnostics: Diagnostic[] = [];

  function visit(node: ts.Node): void {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      CHAINABLE_NAMES.has(node.expression.name.text)
    ) {
      const root = findChainRoot(node.expression.expression);
      if (!root || !validTCalls.has(root)) {
        const methodName = node.expression.name.text;
        diagnostics.push(
          createDiagnostic({
            code: 'YPK403',
            fileId,
            hint: `\`.${methodName}()\` is only valid on the direct result of \`t()\`.`,
            message: `\`.${methodName}()\` called on a value that is not a direct \`t()\` result.`,
            range: toRange(node, sourceFile),
            severity: 'error',
            source: fileText,
          }),
        );
      }
    }
    ts.forEachChild(node, visit);
  }

  ts.forEachChild(sourceFile, visit);
  return diagnostics;
}

function findChainRoot(expr: ts.Expression): ts.CallExpression | undefined {
  if (!ts.isCallExpression(expr)) {
    return undefined;
  }
  if (
    ts.isPropertyAccessExpression(expr.expression) &&
    CHAINABLE_NAMES.has(expr.expression.name.text)
  ) {
    return findChainRoot(expr.expression.expression);
  }
  return expr;
}

export function parseChainables(callSite: CallSite): ParsedChainables {
  const sourceFile = callSite.node.getSourceFile();
  const fileText = sourceFile.text;
  const fileId = sourceFile.fileName;
  const diagnostics: Diagnostic[] = [];
  const result: ParsedChainables = { diagnostics };

  let current: ts.Node = callSite.node;
  while (true) {
    const parent = current.parent;
    if (!parent || !ts.isPropertyAccessExpression(parent)) {
      break;
    }
    if (parent.expression !== current) {
      break;
    }
    const grandparent = parent.parent;
    if (
      !grandparent ||
      !ts.isCallExpression(grandparent) ||
      grandparent.expression !== parent
    ) {
      break;
    }

    const methodName = parent.name.text;
    if (!CHAINABLE_NAMES.has(methodName)) {
      break;
    }

    const callRange = toRange(grandparent, sourceFile);
    const argRange = grandparent.arguments[0]
      ? toRange(grandparent.arguments[0], sourceFile)
      : callRange;

    if (alreadySet(result, methodName)) {
      diagnostics.push(
        createDiagnostic({
          code: 'YPK402',
          fileId,
          hint: `Call \`.${methodName}()\` at most once per \`t()\` call.`,
          message: `\`.${methodName}()\` is called more than once on the same \`t()\` call.`,
          range: callRange,
          severity: 'error',
          source: fileText,
        }),
      );
      current = grandparent;
      continue;
    }

    const value = readChainableArgument(grandparent, methodName);
    if (value === undefined) {
      diagnostics.push(
        createDiagnostic({
          code: 'YPK401',
          fileId,
          hint: `Pass a static ${expectedKind(methodName)} literal to \`.${methodName}()\`.`,
          message: `\`.${methodName}()\` argument must be a static ${expectedKind(methodName)} literal.`,
          range: argRange,
          severity: 'error',
          source: fileText,
        }),
      );
      current = grandparent;
      continue;
    }

    assign(result, methodName, value);
    current = grandparent;
  }

  return result;
}

function alreadySet(result: ParsedChainables, name: string): boolean {
  if (name === 'tag') return result.tag !== undefined;
  if (name === 'hint') return result.hint !== undefined;
  if (name === 'maxLength') return result.maxLength !== undefined;
  return false;
}

function assign(
  result: ParsedChainables,
  name: string,
  value: string | number,
): void {
  if (name === 'tag' && typeof value === 'string') {
    result.tag = value;
  } else if (name === 'hint' && typeof value === 'string') {
    result.hint = value;
  } else if (name === 'maxLength' && typeof value === 'number') {
    result.maxLength = value;
  }
}

function readChainableArgument(
  call: ts.CallExpression,
  name: string,
): string | number | undefined {
  const arg = call.arguments[0];
  if (!arg) {
    return undefined;
  }
  if (name === 'maxLength') {
    if (!ts.isNumericLiteral(arg)) {
      return undefined;
    }
    const parsed = Number(arg.text);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return undefined;
    }
    return parsed;
  }
  if (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) {
    return arg.text;
  }
  return undefined;
}

function expectedKind(name: string): string {
  return name === 'maxLength' ? 'positive integer' : 'string';
}
