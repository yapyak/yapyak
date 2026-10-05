import type MagicString from 'magic-string';
import type { ComponentHook, Fragment } from '../../../../processor';
import type { BindingTable } from '../../binding';
import type { ParsedCallSite } from '../extract';

import ts from '@typescript/typescript6';

import { FORMAT_EXPORT, YAPYAK_MODULE, resolveBindings } from '../../binding';
import { remapOffset } from '../../offset';
import { getScriptKind } from '../../script-kind';
import { extractPrologueDirectives } from './directive';
import { hasIdentifier } from './identifier';

export type CollectComponentHostsInput = {
  callSites: ParsedCallSite[];
  componentHook: ComponentHook;
  fileId: string;
  fragments: Fragment[];
  source: string;
};

export type InjectComponentHooksInput = {
  hosts: ComponentHost[];
  invocation: string;
  magicString: MagicString;
};

type ComponentHost = {
  body: ts.ConciseBody;
  fragmentOffset: number;
  sourceFile: ts.SourceFile;
};

type HostFunction =
  | ts.ArrowFunction
  | ts.FunctionExpression
  | (ts.FunctionDeclaration & {
      body: ts.Block;
    });

const YAPYAK_SPECIFIER_RX = new RegExp(`['"]${YAPYAK_MODULE}['"]`);

export function collectComponentHosts(
  input: CollectComponentHostsInput,
): ComponentHost[] {
  const { componentHook, source } = input;
  if (componentHook.eligibilityDirective !== undefined) {
    const directives = extractPrologueDirectives(source);
    if (!directives.includes(componentHook.eligibilityDirective)) {
      return [];
    }
  }
  const canReadFormat =
    hasIdentifier(source, FORMAT_EXPORT) && YAPYAK_SPECIFIER_RX.test(source);
  const hosts: ComponentHost[] = [];
  for (const fragment of input.fragments) {
    if (fragment.type !== 'script') {
      continue;
    }
    const fragmentOffset = remapOffset(0, fragment);
    const fragmentEnd = fragmentOffset + fragment.code.length;
    const sourceFile = ts.createSourceFile(
      input.fileId,
      fragment.code,
      ts.ScriptTarget.ESNext,
      true,
      getScriptKind(input.fileId, fragment.language),
    );
    const canHoldJsx = sourceFile.languageVariant === ts.LanguageVariant.JSX;
    const hostsByFunction = new Map<HostFunction, ComponentHost>();
    const registerHost = (host: HostFunction | undefined): void => {
      if (host === undefined || hostsByFunction.has(host)) {
        return;
      }
      hostsByFunction.set(host, {
        body: host.body,
        fragmentOffset,
        sourceFile,
      });
    };
    const visit = (node: ts.Node): void => {
      if (
        isHostCandidate(node) &&
        isHostFunction(node, componentHook, canHoldJsx, false)
      ) {
        registerHost(node);
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
    for (const callSite of input.callSites) {
      const offset = callSite.range.start.offset;
      if (offset < fragmentOffset || offset >= fragmentEnd) {
        continue;
      }
      registerHost(
        resolveHost(
          getNodeAt(sourceFile, offset - fragmentOffset),
          componentHook,
          canHoldJsx,
        ),
      );
    }
    if (canReadFormat) {
      const bindings = resolveBindings(sourceFile, FORMAT_EXPORT);
      for (const reference of collectFormatReferences(sourceFile, bindings)) {
        registerHost(resolveHost(reference, componentHook, canHoldJsx));
      }
    }
    hosts.push(...hostsByFunction.values());
  }
  return hosts;
}

export function injectComponentHooks(input: InjectComponentHooksInput): void {
  for (const host of input.hosts) {
    emitHookInvocation(host, input.invocation, input.magicString);
  }
}

function isHostCandidate(node: ts.Node): node is HostFunction {
  if (ts.isFunctionDeclaration(node)) {
    return node.body !== undefined;
  }
  return ts.isArrowFunction(node) || ts.isFunctionExpression(node);
}

function isHostFunction(
  host: HostFunction,
  componentHook: ComponentHook,
  canHoldJsx: boolean,
  hasYapyakRead: boolean,
): boolean {
  const { evidencePattern, namePattern } = componentHook;
  if (ts.isFunctionDeclaration(host)) {
    if (host.name) {
      return (
        isEligibleName(host.name.text, componentHook, canHoldJsx) &&
        (hasYapyakRead || hasComponentEvidence(host, evidencePattern))
      );
    }
    return canHoldJsx && hasComponentEvidence(host, evidencePattern);
  }
  if (isCurried(host)) {
    return false;
  }
  const name = readDirectName(host);
  if (name !== undefined) {
    return (
      isEligibleName(name, componentHook, canHoldJsx) &&
      (hasYapyakRead || hasComponentEvidence(host, evidencePattern))
    );
  }
  return (
    canHoldJsx &&
    hasComponentEvidence(host, evidencePattern) &&
    hasComponentPosition(host, namePattern)
  );
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

function resolveHost(
  node: ts.Node,
  componentHook: ComponentHook,
  canHoldJsx: boolean,
): HostFunction | undefined {
  let current: ts.Node | undefined = node;
  while (current && !ts.isSourceFile(current)) {
    if (
      isHostCandidate(current) &&
      isHostFunction(current, componentHook, canHoldJsx, true)
    ) {
      return current;
    }
    current = current.parent;
  }
  return undefined;
}

function collectFormatReferences(
  sourceFile: ts.SourceFile,
  bindings: BindingTable,
): ts.Identifier[] {
  const references: ts.Identifier[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isIdentifier(node) && isFormatReference(node, bindings)) {
      references.push(node);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return references;
}

function emitHookInvocation(
  host: ComponentHost,
  invocation: string,
  magicString: MagicString,
): void {
  const { body, fragmentOffset, sourceFile } = host;
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

function isEligibleName(
  name: string,
  componentHook: ComponentHook,
  canHoldJsx: boolean,
): boolean {
  if (!componentHook.namePattern.test(name)) {
    return false;
  }
  return canHoldJsx || componentHook.evidencePattern.test(name);
}

function hasComponentEvidence(
  host: HostFunction,
  evidencePattern: RegExp,
): boolean {
  const body = host.body;
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

function isFormatReference(
  node: ts.Identifier,
  bindings: BindingTable,
): boolean {
  const parent = node.parent;
  if (ts.isImportSpecifier(parent) || ts.isImportClause(parent)) {
    return false;
  }
  if (
    (ts.isPropertyAssignment(parent) ||
      ts.isJsxAttribute(parent) ||
      ts.isMethodDeclaration(parent) ||
      ts.isPropertyDeclaration(parent)) &&
    parent.name === node
  ) {
    return false;
  }
  if (ts.isBindingElement(parent) && parent.initializer !== node) {
    return false;
  }
  if (ts.isPropertyAccessExpression(parent) && parent.name === node) {
    return (
      node.text === FORMAT_EXPORT &&
      ts.isIdentifier(parent.expression) &&
      bindings.find(parent.expression.text, parent.expression)?.kind ===
        'namespace'
    );
  }
  return bindings.find(node.text, node)?.kind === 'direct';
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
