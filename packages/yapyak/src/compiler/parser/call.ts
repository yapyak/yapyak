import type {
  Argument,
  CallExpression,
  IdentifierReference,
  Node,
  StaticMemberExpression,
} from 'oxc-parser';
import type { Range } from '../../processor';
import type { Binding, BindingTable } from './binding';
import type { Diagnostic } from './diagnostic';
import type { SourceFile } from './source-file';

import { buildDiagnostic } from '../../diagnostic';
import { T_EXPORT } from './binding';
import { collectChildren } from './child';
import { toRange } from './range';

export type CallSite = {
  binding: Binding;
  contextExpression?: Argument;
  localeExpression?: Argument;
  node: CallExpression;
  paramsExpression?: Argument;
  range: Range;
  sourceExpression?: Argument;
};

export type DiscoverCallsResult = {
  callSites: CallSite[];
  diagnostics: Diagnostic[];
};

const IN_NAME = 'in';
const AS_NAME = 'as';

type DiscoveryContext = {
  bindings: BindingTable;
  callSites: CallSite[];
  consumed: Set<CallExpression>;
  diagnostics: Diagnostic[];
  sourceFile: SourceFile;
};

export function discoverCalls(
  sourceFile: SourceFile,
  bindings: BindingTable,
): DiscoverCallsResult {
  const context: DiscoveryContext = {
    bindings,
    callSites: [],
    consumed: new Set(),
    diagnostics: [],
    sourceFile,
  };
  walk(sourceFile.program, context);
  return {
    callSites: context.callSites,
    diagnostics: context.diagnostics,
  };
}

function walk(node: Node, context: DiscoveryContext): void {
  if (node.type === 'CallExpression' && !context.consumed.has(node)) {
    tryExtract(node, context);
  }
  for (const child of collectChildren(node)) {
    walk(child, context);
  }
}

function tryExtract(call: CallExpression, context: DiscoveryContext): void {
  const callee = call.callee;

  if (callee.type === 'Identifier') {
    extractBaseCall(call, callee, context);
    return;
  }

  if (isStaticMemberExpression(callee)) {
    extractMemberCall(call, callee, context);
  }
}

function extractBaseCall(
  call: CallExpression,
  callee: IdentifierReference,
  context: DiscoveryContext,
): void {
  const binding = context.bindings.find(callee.name, call);
  if (!binding || binding.kind === 'namespace' || binding.kind === 'shadow') {
    return;
  }
  const callSite: CallSite = {
    binding,
    node: call,
    range: toRange(call, context.sourceFile),
  };
  if (call.arguments[0]) {
    callSite.sourceExpression = call.arguments[0];
  }
  if (call.arguments[1]) {
    callSite.paramsExpression = call.arguments[1];
  }
  context.callSites.push(callSite);
}

function isStaticMemberExpression(node: Node): node is StaticMemberExpression {
  return (
    node.type === 'MemberExpression' &&
    !node.computed &&
    node.property.type === 'Identifier'
  );
}

function extractMemberCall(
  call: CallExpression,
  callee: StaticMemberExpression,
  context: DiscoveryContext,
): void {
  const methodName = callee.property.name;
  const receiver = callee.object;

  if (methodName === T_EXPORT && receiver.type === 'Identifier') {
    extractNamespaceBase(call, receiver, context);
    return;
  }

  if (methodName !== IN_NAME && methodName !== AS_NAME) {
    return;
  }

  if (receiver.type === 'Identifier') {
    extractDirectModifier(call, receiver, methodName, context);
    return;
  }

  if (receiver.type === 'CallExpression') {
    extractChainedModifier(call, receiver, methodName, context);
    return;
  }

  if (
    isStaticMemberExpression(receiver) &&
    receiver.object.type === 'Identifier' &&
    receiver.property.name === T_EXPORT
  ) {
    extractNamespaceModifier(call, receiver, methodName, context);
  }
}

function extractNamespaceBase(
  call: CallExpression,
  receiver: IdentifierReference,
  context: DiscoveryContext,
): void {
  const binding = context.bindings.find(receiver.name, call);
  if (binding?.kind !== 'namespace') {
    return;
  }
  const callSite: CallSite = {
    binding,
    node: call,
    range: toRange(call, context.sourceFile),
  };
  if (call.arguments[0]) {
    callSite.sourceExpression = call.arguments[0];
  }
  if (call.arguments[1]) {
    callSite.paramsExpression = call.arguments[1];
  }
  context.callSites.push(callSite);
}

function extractDirectModifier(
  call: CallExpression,
  receiver: IdentifierReference,
  methodName: string,
  context: DiscoveryContext,
): void {
  const binding = context.bindings.find(receiver.name, call);
  if (!binding || binding.kind === 'namespace' || binding.kind === 'shadow') {
    return;
  }

  if (call.arguments.length === 1) {
    emitCaptureDiagnostic(call, methodName, context);
    return;
  }

  const callSite: CallSite = {
    binding,
    node: call,
    range: toRange(call, context.sourceFile),
  };

  if (call.arguments[1]) {
    callSite.sourceExpression = call.arguments[1];
  }
  if (call.arguments[2]) {
    callSite.paramsExpression = call.arguments[2];
  }

  if (methodName === IN_NAME) {
    callSite.localeExpression = call.arguments[0];
  } else {
    callSite.contextExpression = call.arguments[0];
  }

  context.callSites.push(callSite);
}

function extractChainedModifier(
  call: CallExpression,
  innerCall: CallExpression,
  outerMethod: string,
  context: DiscoveryContext,
): void {
  const innerCallee = innerCall.callee;
  if (!isStaticMemberExpression(innerCallee)) {
    return;
  }

  const innerMethod = innerCallee.property.name;
  if (innerMethod === outerMethod) {
    return;
  }
  if (innerMethod !== IN_NAME && innerMethod !== AS_NAME) {
    return;
  }

  const binding = resolveChainBinding(innerCallee, innerCall, context);
  if (!binding) {
    return;
  }

  if (innerCall.arguments.length !== 1) {
    return;
  }

  const callSite: CallSite = {
    binding,
    node: call,
    range: toRange(call, context.sourceFile),
  };

  if (call.arguments[1]) {
    callSite.sourceExpression = call.arguments[1];
  }
  if (call.arguments[2]) {
    callSite.paramsExpression = call.arguments[2];
  }

  if (innerMethod === IN_NAME) {
    callSite.localeExpression = innerCall.arguments[0];
    callSite.contextExpression = call.arguments[0];
  } else {
    callSite.contextExpression = innerCall.arguments[0];
    callSite.localeExpression = call.arguments[0];
  }

  context.consumed.add(innerCall);
  context.callSites.push(callSite);
}

function extractNamespaceModifier(
  call: CallExpression,
  receiver: StaticMemberExpression,
  methodName: string,
  context: DiscoveryContext,
): void {
  if (receiver.object.type !== 'Identifier') {
    return;
  }
  const binding = context.bindings.find(receiver.object.name, call);
  if (binding?.kind !== 'namespace') {
    return;
  }

  if (call.arguments.length === 1) {
    emitCaptureDiagnostic(call, methodName, context);
    return;
  }

  const callSite: CallSite = {
    binding,
    node: call,
    range: toRange(call, context.sourceFile),
  };

  if (call.arguments[1]) {
    callSite.sourceExpression = call.arguments[1];
  }
  if (call.arguments[2]) {
    callSite.paramsExpression = call.arguments[2];
  }

  if (methodName === IN_NAME) {
    callSite.localeExpression = call.arguments[0];
  } else {
    callSite.contextExpression = call.arguments[0];
  }

  context.callSites.push(callSite);
}

function resolveChainBinding(
  innerCallee: StaticMemberExpression,
  innerCall: CallExpression,
  context: DiscoveryContext,
): Binding | undefined {
  const innerReceiver = innerCallee.object;
  if (innerReceiver.type === 'Identifier') {
    const binding = context.bindings.find(innerReceiver.name, innerCall);
    if (!binding || binding.kind === 'namespace' || binding.kind === 'shadow') {
      return undefined;
    }
    return binding;
  }
  if (
    isStaticMemberExpression(innerReceiver) &&
    innerReceiver.object.type === 'Identifier' &&
    innerReceiver.property.name === T_EXPORT
  ) {
    const binding = context.bindings.find(innerReceiver.object.name, innerCall);
    if (binding?.kind === 'namespace') {
      return binding;
    }
  }
  return undefined;
}

function emitCaptureDiagnostic(
  call: CallExpression,
  methodName: string,
  context: DiscoveryContext,
): void {
  if (isInlineChain(call)) {
    return;
  }
  const sourceFile = context.sourceFile;
  context.diagnostics.push(
    buildDiagnostic(
      'CONTEXT_DYNAMIC_CALL',
      {
        methodName: methodName === IN_NAME ? 'in' : 'as',
      },
      {
        fileId: sourceFile.fileId,
        range: toRange(call, sourceFile),
        severity: 'error',
      },
    ),
  );
}

function isInlineChain(call: CallExpression): boolean {
  const parent = call.parent;
  if (!parent || !isStaticMemberExpression(parent)) {
    return false;
  }
  if (parent.object !== call) {
    return false;
  }
  const grandparent = parent.parent;
  if (grandparent?.type !== 'CallExpression') {
    return false;
  }
  if (grandparent.callee !== parent) {
    return false;
  }
  const propertyName = parent.property.name;
  if (propertyName !== IN_NAME && propertyName !== AS_NAME) {
    return false;
  }
  return grandparent.arguments.length >= 2;
}
