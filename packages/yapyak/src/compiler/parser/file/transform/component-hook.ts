import type MagicString from 'magic-string';
import type {
  ArrowFunctionExpression,
  CallExpression,
  Expression,
  FunctionBody,
  Function as FunctionNode,
  Node,
} from 'oxc-parser';
import type { ComponentHook, Fragment } from '../../../../processor';
import type { BindingTable } from '../../binding';
import type { SourceFile } from '../../source-file';
import type { ParsedCallSite } from '../extract';
import type { IdentifierNode } from './reference';

import { FORMAT_EXPORT, YAPYAK_MODULE, resolveBindings } from '../../binding';
import { collectChildren } from '../../child';
import { remapOffset } from '../../offset';
import { hasIdentifier } from './identifier';
import { isReference } from './reference';

export type CollectComponentHostsInput = {
  callSites: ParsedCallSite[];
  componentHook: ComponentHook;
  directives: string[];
  source: string;
  sourceFilesByFragment: Map<Fragment, SourceFile>;
};

export type InjectComponentHooksInput = {
  hosts: ComponentHost[];
  invocation: string;
  magicString: MagicString;
};

type ComponentHost = {
  body: Expression | FunctionBody;
  fragmentOffset: number;
};

type HostFunction =
  | ArrowFunctionExpression
  | (FunctionNode & {
      body: FunctionBody;
    });

const YAPYAK_SPECIFIER_RX = new RegExp(`['"]${YAPYAK_MODULE}['"]`);

export function collectComponentHosts(
  input: CollectComponentHostsInput,
): ComponentHost[] {
  const { componentHook, source } = input;
  if (
    componentHook.eligibilityDirective !== undefined &&
    !input.directives.includes(componentHook.eligibilityDirective)
  ) {
    return [];
  }
  const canReadFormat =
    hasIdentifier(source, FORMAT_EXPORT) && YAPYAK_SPECIFIER_RX.test(source);
  const hosts: ComponentHost[] = [];
  for (const [fragment, sourceFile] of input.sourceFilesByFragment) {
    const fragmentOffset = remapOffset(0, fragment);
    const fragmentEnd = fragmentOffset + fragment.code.length;
    const canHoldJsx = sourceFile.lang === 'jsx' || sourceFile.lang === 'tsx';
    const hostsByFunction = new Map<HostFunction, ComponentHost>();
    const registerHost = (host: HostFunction | undefined): void => {
      if (host === undefined || hostsByFunction.has(host)) {
        return;
      }
      hostsByFunction.set(host, {
        body: host.body,
        fragmentOffset,
      });
    };
    const visit = (node: Node): void => {
      if (
        isHostCandidate(node) &&
        isHostFunction(node, componentHook, canHoldJsx, false)
      ) {
        registerHost(node);
      }
      for (const child of collectChildren(node)) {
        visit(child);
      }
    };
    visit(sourceFile.program);
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

function isHostCandidate(node: Node): node is HostFunction {
  if (node.type === 'FunctionDeclaration') {
    return node.body !== null;
  }
  if (node.type === 'FunctionExpression') {
    return !isMethodValue(node);
  }
  return node.type === 'ArrowFunctionExpression';
}

function isMethodValue(node: FunctionNode): boolean {
  const parent = node.parent;
  if (parent?.type === 'MethodDefinition') {
    return true;
  }
  return (
    parent?.type === 'Property' && (parent.method || parent.kind !== 'init')
  );
}

function isHostFunction(
  host: HostFunction,
  componentHook: ComponentHook,
  canHoldJsx: boolean,
  hasYapyakRead: boolean,
): boolean {
  const { evidencePattern, namePattern } = componentHook;
  if (host.type === 'FunctionDeclaration') {
    if (host.id) {
      return (
        isEligibleName(host.id.name, componentHook, canHoldJsx) &&
        (hasYapyakRead || hasComponentEvidence(host, evidencePattern))
      );
    }
    return canHoldJsx && hasComponentEvidence(host, evidencePattern);
  }
  if (isCurried(host)) {
    return false;
  }
  const name = findDirectName(host);
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

function getNodeAt(sourceFile: SourceFile, position: number): Node {
  let current: Node = sourceFile.program;
  let child = findChildAt(current, position);
  while (child) {
    current = child;
    child = findChildAt(current, position);
  }
  return current;
}

function resolveHost(
  node: Node,
  componentHook: ComponentHook,
  canHoldJsx: boolean,
): HostFunction | undefined {
  let current: Node | null | undefined = node;
  while (current && current.type !== 'Program') {
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
  sourceFile: SourceFile,
  bindings: BindingTable,
): Node[] {
  const references: Node[] = [];
  const visit = (node: Node): void => {
    if (node.type === 'Identifier' && isFormatReference(node, bindings)) {
      references.push(node);
    }
    for (const child of collectChildren(node)) {
      visit(child);
    }
  };
  visit(sourceFile.program);
  return references;
}

function emitHookInvocation(
  host: ComponentHost,
  invocation: string,
  magicString: MagicString,
): void {
  const { body, fragmentOffset } = host;
  if (body.type === 'BlockStatement') {
    magicString.appendLeft(body.start + 1 + fragmentOffset, `${invocation}();`);
    return;
  }
  magicString.appendLeft(
    body.start + fragmentOffset,
    `{${invocation}();return(`,
  );
  magicString.appendRight(body.end + fragmentOffset, ');}');
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
  const visit = (node: Node): void => {
    if (found) {
      return;
    }
    if (node.type === 'JSXElement' || node.type === 'JSXFragment') {
      found = true;
      return;
    }
    if (
      node.type === 'CallExpression' &&
      isEvidenceCall(node, evidencePattern)
    ) {
      found = true;
      return;
    }
    if (isHostCandidate(node)) {
      return;
    }
    for (const child of collectChildren(node)) {
      visit(child);
    }
  };
  if (body.type === 'BlockStatement') {
    for (const child of collectChildren(body)) {
      visit(child);
    }
    return found;
  }
  visit(body);
  return found;
}

function isCurried(node: HostFunction): boolean {
  return (
    node.body.type === 'ArrowFunctionExpression' ||
    node.body.type === 'FunctionExpression'
  );
}

function findDirectName(node: HostFunction): string | undefined {
  if (node.id) {
    return node.id.name;
  }
  const parent = node.parent;
  if (
    parent?.type === 'VariableDeclarator' &&
    parent.id.type === 'Identifier'
  ) {
    return parent.id.name;
  }
  if (
    parent?.type === 'Property' &&
    !parent.computed &&
    parent.key.type === 'Identifier'
  ) {
    return parent.key.name;
  }
  return undefined;
}

function hasComponentPosition(
  node: HostFunction,
  namePattern: RegExp,
): boolean {
  const parent = node.parent;
  if (isExportAssignment(parent)) {
    return true;
  }
  if (parent?.type === 'ReturnStatement') {
    return true;
  }
  if (parent?.type === 'ArrowFunctionExpression' && parent.body === node) {
    return true;
  }
  let current: Node = node;
  let outer: Node | undefined = parent;
  while (
    outer?.type === 'CallExpression' &&
    outer.arguments.some((argument) => argument === current)
  ) {
    current = outer;
    outer = outer.parent;
  }
  if (current === node) {
    return false;
  }
  if (isExportAssignment(outer)) {
    return true;
  }
  if (outer?.type === 'VariableDeclarator' && outer.id.type === 'Identifier') {
    return namePattern.test(outer.id.name);
  }
  if (
    outer?.type === 'Property' &&
    !outer.computed &&
    outer.key.type === 'Identifier'
  ) {
    return namePattern.test(outer.key.name);
  }
  return false;
}

function isExportAssignment(node: Node | undefined): boolean {
  return (
    node?.type === 'ExportDefaultDeclaration' ||
    node?.type === 'TSExportAssignment'
  );
}

function findChildAt(node: Node, position: number): Node | undefined {
  return collectChildren(node).find(
    (candidate) => candidate.start <= position && position < candidate.end,
  );
}

function isFormatReference(
  node: IdentifierNode,
  bindings: BindingTable,
): boolean {
  const parent = node.parent;
  if (
    parent?.type === 'MemberExpression' &&
    !parent.computed &&
    parent.property === node
  ) {
    return (
      node.name === FORMAT_EXPORT &&
      parent.object.type === 'Identifier' &&
      bindings.find(parent.object.name, parent.object)?.kind === 'namespace'
    );
  }
  if (!isReference(node)) {
    return false;
  }
  return bindings.find(node.name, node)?.kind === 'direct';
}

function isEvidenceCall(
  node: CallExpression,
  evidencePattern: RegExp,
): boolean {
  const callee = node.callee;
  if (callee.type === 'Identifier') {
    return evidencePattern.test(callee.name);
  }
  if (
    callee.type === 'MemberExpression' &&
    !callee.computed &&
    callee.property.type === 'Identifier'
  ) {
    return evidencePattern.test(callee.property.name);
  }
  return false;
}
