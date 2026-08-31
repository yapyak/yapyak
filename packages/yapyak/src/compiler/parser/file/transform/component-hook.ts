import type MagicString from 'magic-string';
import type { ComponentHook, Fragment } from '../../../../processor';
import type { ParsedCallSite } from '../extract';

import ts from '@typescript/typescript6';

import { remapOffset } from '../../offset';
import { getScriptKind } from '../../script-kind';
import { extractPrologueDirectives } from './directive';

export type InjectComponentHooksInput = {
  callSites: ParsedCallSite[];
  componentHook: ComponentHook;
  fileId: string;
  fragments: Fragment[];
  invocation: string;
  magicString: MagicString;
  source: string;
};

type HostFunction =
  | ts.ArrowFunction
  | ts.FunctionDeclaration
  | ts.FunctionExpression;

export function injectComponentHooks(input: InjectComponentHooksInput): void {
  const { componentHook, source } = input;
  if (componentHook.eligibilityDirective !== undefined) {
    const directives = extractPrologueDirectives(source);
    if (!directives.includes(componentHook.eligibilityDirective)) {
      return;
    }
  }
  for (const fragment of input.fragments) {
    if (fragment.type !== 'script') {
      continue;
    }
    const sourceFile = ts.createSourceFile(
      input.fileId,
      fragment.code,
      ts.ScriptTarget.ESNext,
      true,
      getScriptKind(input.fileId, fragment.language),
    );
    const fragmentOffset = remapOffset(0, fragment);
    const fragmentEnd = fragmentOffset + fragment.code.length;
    const hosts = new Set<HostFunction>();
    for (const callSite of input.callSites) {
      const offset = callSite.range.start.offset;
      if (offset < fragmentOffset || offset >= fragmentEnd) {
        continue;
      }
      const node = getNodeAt(sourceFile, offset - fragmentOffset);
      const host = resolveHost(node, componentHook);
      if (host) {
        hosts.add(host);
      }
    }
    for (const host of hosts) {
      emitHookInvocation(
        host,
        sourceFile,
        fragmentOffset,
        input.invocation,
        input.magicString,
      );
    }
  }
}
function getNodeAt(sourceFile: ts.SourceFile, position: number): ts.Node {
  let current: ts.Node = sourceFile;
  let child = findChildAt(current, sourceFile, position);
  while (child) {
    current = child;
    child = findChildAt(current, sourceFile, position);
  }
  return current;
}

function findChildAt(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  position: number,
): ts.Node | undefined {
  return ts.forEachChild(node, (candidate) =>
    candidate.getStart(sourceFile) <= position && position < candidate.getEnd()
      ? candidate
      : undefined,
  );
}

function resolveHost(
  node: ts.Node,
  componentHook: ComponentHook,
): HostFunction | undefined {
  let current: ts.Node | undefined = node;
  while (current && !ts.isSourceFile(current)) {
    if (ts.isFunctionDeclaration(current) && current.body) {
      if (current.name) {
        if (componentHook.namePattern.test(current.name.text)) {
          return current;
        }
      } else if (hasComponentEvidence(current, componentHook.evidencePattern)) {
        return current;
      }
    }
    if (
      (ts.isArrowFunction(current) || ts.isFunctionExpression(current)) &&
      !isCurried(current)
    ) {
      const name = readDirectName(current);
      if (name !== undefined) {
        if (componentHook.namePattern.test(name)) {
          return current;
        }
      } else if (
        hasComponentEvidence(current, componentHook.evidencePattern) &&
        hasComponentPosition(current, componentHook.namePattern)
      ) {
        return current;
      }
    }
    current = current.parent;
  }
  return undefined;
}

function hasComponentEvidence(
  host: HostFunction,
  evidencePattern: RegExp,
): boolean {
  const body = host.body;
  if (body === undefined) {
    return false;
  }
  let found = false;
  const visit = (node: ts.Node): void => {
    if (found) {
      return;
    }
    if (
      ts.isJsxElement(node) ||
      ts.isJsxSelfClosingElement(node) ||
      ts.isJsxFragment(node)
    ) {
      found = true;
      return;
    }
    if (ts.isCallExpression(node) && isEvidenceCall(node, evidencePattern)) {
      found = true;
      return;
    }
    if (
      ts.isArrowFunction(node) ||
      ts.isFunctionExpression(node) ||
      ts.isFunctionDeclaration(node)
    ) {
      return;
    }
    ts.forEachChild(node, visit);
  };
  if (ts.isBlock(body)) {
    ts.forEachChild(body, visit);
    return found;
  }
  visit(body);
  return found;
}

function isEvidenceCall(
  node: ts.CallExpression,
  evidencePattern: RegExp,
): boolean {
  const callee = node.expression;
  if (ts.isIdentifier(callee)) {
    return evidencePattern.test(callee.text);
  }
  if (ts.isPropertyAccessExpression(callee)) {
    return evidencePattern.test(callee.name.text);
  }
  return false;
}

function isCurried(node: ts.ArrowFunction | ts.FunctionExpression): boolean {
  return ts.isArrowFunction(node.body) || ts.isFunctionExpression(node.body);
}

function readDirectName(
  node: ts.ArrowFunction | ts.FunctionExpression,
): string | undefined {
  if (ts.isFunctionExpression(node) && node.name) {
    return node.name.text;
  }
  const parent = node.parent;
  if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) {
    return parent.name.text;
  }
  if (ts.isPropertyAssignment(parent) && ts.isIdentifier(parent.name)) {
    return parent.name.text;
  }
  return undefined;
}

function hasComponentPosition(
  node: ts.ArrowFunction | ts.FunctionExpression,
  namePattern: RegExp,
): boolean {
  const parent = node.parent;
  if (ts.isExportAssignment(parent)) {
    return true;
  }
  if (ts.isReturnStatement(parent)) {
    return true;
  }
  if (ts.isArrowFunction(parent) && parent.body === node) {
    return true;
  }
  let current: ts.Node = node;
  let outer: ts.Node = parent;
  while (
    ts.isCallExpression(outer) &&
    outer.arguments.some((argument) => argument === current)
  ) {
    current = outer;
    outer = outer.parent;
  }
  if (current === node) {
    return false;
  }
  if (ts.isExportAssignment(outer)) {
    return true;
  }
  if (ts.isVariableDeclaration(outer) && ts.isIdentifier(outer.name)) {
    return namePattern.test(outer.name.text);
  }
  if (ts.isPropertyAssignment(outer) && ts.isIdentifier(outer.name)) {
    return namePattern.test(outer.name.text);
  }
  return false;
}

function emitHookInvocation(
  host: HostFunction,
  sourceFile: ts.SourceFile,
  fragmentOffset: number,
  invocation: string,
  magicString: MagicString,
): void {
  const body = host.body;
  if (body === undefined) {
    return;
  }
  if (ts.isBlock(body)) {
    magicString.appendLeft(
      body.getStart(sourceFile) + 1 + fragmentOffset,
      `${invocation}();`,
    );
    return;
  }
  magicString.appendLeft(
    body.getStart(sourceFile) + fragmentOffset,
    `{${invocation}();return(`,
  );
  magicString.appendRight(body.getEnd() + fragmentOffset, ');}');
}
