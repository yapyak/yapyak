import type { Binding, BindingTable } from './binding';
import type { Diagnostic } from './diagnostic';
import type { ElisionContext } from './fragment';
import type { Range } from './range';

import * as ts from 'typescript';

import { createDiagnostic } from './diagnostic';
import { toRange } from './range';

export interface CallSite {
  binding: Binding;
  contextArg?: ts.Expression;
  elision?: ElisionContext;
  localeExpression?: ts.Expression;
  node: ts.CallExpression;
  paramsArg?: ts.Expression;
  range: Range;
  sourceArg?: ts.Expression;
}

export interface DiscoverCallsResult {
  callSites: CallSite[];
  diagnostics: Diagnostic[];
}

const RUNTIME_NAME = 't';
const IN_NAME = 'in';
const AT_NAME = 'at';

interface DiscoveryContext {
  bindings: BindingTable;
  callSites: CallSite[];
  consumed: Set<ts.CallExpression>;
  diagnostics: Diagnostic[];
  sourceFile: ts.SourceFile;
}

export function discoverCalls(
  sourceFile: ts.SourceFile,
  bindings: BindingTable,
): DiscoverCallsResult {
  const context: DiscoveryContext = {
    bindings,
    callSites: [],
    consumed: new Set(),
    diagnostics: [],
    sourceFile,
  };
  walk(sourceFile, context);
  return { callSites: context.callSites, diagnostics: context.diagnostics };
}

function walk(node: ts.Node, context: DiscoveryContext): void {
  if (ts.isCallExpression(node) && !context.consumed.has(node)) {
    tryExtract(node, context);
  }
  ts.forEachChild(node, (child) => {
    walk(child, context);
  });
}

function tryExtract(call: ts.CallExpression, context: DiscoveryContext): void {
  const callee = call.expression;

  if (ts.isIdentifier(callee)) {
    extractBaseCall(call, callee, context);
    return;
  }

  if (ts.isPropertyAccessExpression(callee)) {
    extractMemberCall(call, callee, context);
  }
}

function extractBaseCall(
  call: ts.CallExpression,
  callee: ts.Identifier,
  context: DiscoveryContext,
): void {
  const binding = context.bindings.find(callee.text, call);
  if (!binding || binding.kind === 'namespace') {
    return;
  }
  const callSite: CallSite = {
    binding,
    node: call,
    range: toRange(call, context.sourceFile),
  };
  if (call.arguments[0]) {
    callSite.sourceArg = call.arguments[0];
  }
  if (call.arguments[1]) {
    callSite.paramsArg = call.arguments[1];
  }
  context.callSites.push(callSite);
}

function extractMemberCall(
  call: ts.CallExpression,
  callee: ts.PropertyAccessExpression,
  context: DiscoveryContext,
): void {
  const methodName = callee.name.text;
  const receiver = callee.expression;

  if (methodName === RUNTIME_NAME && ts.isIdentifier(receiver)) {
    extractNamespaceBase(call, receiver, context);
    return;
  }

  if (methodName !== IN_NAME && methodName !== AT_NAME) {
    return;
  }

  if (ts.isIdentifier(receiver)) {
    extractDirectModifier(call, callee, receiver, methodName, context);
    return;
  }

  if (ts.isCallExpression(receiver)) {
    extractChainedModifier(call, receiver, methodName, context);
    return;
  }

  if (
    ts.isPropertyAccessExpression(receiver) &&
    ts.isIdentifier(receiver.expression) &&
    receiver.name.text === RUNTIME_NAME
  ) {
    extractNamespaceModifier(call, receiver, methodName, context);
  }
}

function extractNamespaceBase(
  call: ts.CallExpression,
  receiver: ts.Identifier,
  context: DiscoveryContext,
): void {
  const binding = context.bindings.find(receiver.text, call);
  if (binding?.kind !== 'namespace') {
    return;
  }
  const callSite: CallSite = {
    binding,
    node: call,
    range: toRange(call, context.sourceFile),
  };
  if (call.arguments[0]) {
    callSite.sourceArg = call.arguments[0];
  }
  if (call.arguments[1]) {
    callSite.paramsArg = call.arguments[1];
  }
  context.callSites.push(callSite);
}

function extractDirectModifier(
  call: ts.CallExpression,
  callee: ts.PropertyAccessExpression,
  receiver: ts.Identifier,
  methodName: string,
  context: DiscoveryContext,
): void {
  const binding = context.bindings.find(receiver.text, call);
  if (!binding || binding.kind === 'namespace') {
    return;
  }

  if (call.arguments.length === 1) {
    reportCapture(call, methodName, context);
    return;
  }

  const callSite: CallSite = {
    binding,
    node: call,
    range: toRange(call, context.sourceFile),
  };

  if (call.arguments[1]) {
    callSite.sourceArg = call.arguments[1];
  }
  if (call.arguments[2]) {
    callSite.paramsArg = call.arguments[2];
  }

  if (methodName === IN_NAME) {
    callSite.localeExpression = call.arguments[0];
  } else {
    callSite.contextArg = call.arguments[0];
  }

  context.callSites.push(callSite);
}

function extractChainedModifier(
  call: ts.CallExpression,
  innerCall: ts.CallExpression,
  outerMethod: string,
  context: DiscoveryContext,
): void {
  const innerCallee = innerCall.expression;
  if (!ts.isPropertyAccessExpression(innerCallee)) {
    return;
  }

  const innerMethod = innerCallee.name.text;
  if (innerMethod === outerMethod) {
    return;
  }
  if (innerMethod !== IN_NAME && innerMethod !== AT_NAME) {
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
    callSite.sourceArg = call.arguments[1];
  }
  if (call.arguments[2]) {
    callSite.paramsArg = call.arguments[2];
  }

  if (innerMethod === IN_NAME) {
    callSite.localeExpression = innerCall.arguments[0];
    callSite.contextArg = call.arguments[0];
  } else {
    callSite.contextArg = innerCall.arguments[0];
    callSite.localeExpression = call.arguments[0];
  }

  context.consumed.add(innerCall);
  context.callSites.push(callSite);
}

function extractNamespaceModifier(
  call: ts.CallExpression,
  receiver: ts.PropertyAccessExpression,
  methodName: string,
  context: DiscoveryContext,
): void {
  if (!ts.isIdentifier(receiver.expression)) {
    return;
  }
  const binding = context.bindings.find(receiver.expression.text, call);
  if (binding?.kind !== 'namespace') {
    return;
  }

  if (call.arguments.length === 1) {
    reportCapture(call, methodName, context);
    return;
  }

  const callSite: CallSite = {
    binding,
    node: call,
    range: toRange(call, context.sourceFile),
  };

  if (call.arguments[1]) {
    callSite.sourceArg = call.arguments[1];
  }
  if (call.arguments[2]) {
    callSite.paramsArg = call.arguments[2];
  }

  if (methodName === IN_NAME) {
    callSite.localeExpression = call.arguments[0];
  } else {
    callSite.contextArg = call.arguments[0];
  }

  context.callSites.push(callSite);
}

function resolveChainBinding(
  innerCallee: ts.PropertyAccessExpression,
  innerCall: ts.CallExpression,
  context: DiscoveryContext,
): Binding | undefined {
  const innerReceiver = innerCallee.expression;
  if (ts.isIdentifier(innerReceiver)) {
    const binding = context.bindings.find(innerReceiver.text, innerCall);
    if (!binding || binding.kind === 'namespace') {
      return undefined;
    }
    return binding;
  }
  if (
    ts.isPropertyAccessExpression(innerReceiver) &&
    ts.isIdentifier(innerReceiver.expression) &&
    innerReceiver.name.text === RUNTIME_NAME
  ) {
    const binding = context.bindings.find(
      innerReceiver.expression.text,
      innerCall,
    );
    if (binding?.kind === 'namespace') {
      return binding;
    }
  }
  return undefined;
}

function reportCapture(
  call: ts.CallExpression,
  methodName: string,
  context: DiscoveryContext,
): void {
  if (isInlineChain(call)) {
    return;
  }
  const sourceFile = context.sourceFile;
  context.diagnostics.push(
    createDiagnostic({
      code: 'YPK405',
      fileId: sourceFile.fileName,
      hint:
        methodName === IN_NAME
          ? "Pass the source inline: `t.in('sv', 'source')` or chain with `.at()`: `t.in('sv').at('context', 'source')`."
          : "Pass the source inline: `t.at('context', 'source')` or chain with `.in()`: `t.at('context').in('sv', 'source')`.",
      message: `\`t.${methodName}()\` captured. Modifiers must be used inline — see the hint for valid forms.`,
      range: toRange(call, sourceFile),
      severity: 'error',
      source: sourceFile.text,
    }),
  );
}

function isInlineChain(call: ts.CallExpression): boolean {
  const parent = call.parent;
  if (!ts.isPropertyAccessExpression(parent)) {
    return false;
  }
  if (parent.expression !== call) {
    return false;
  }
  const grandparent = parent.parent;
  if (!ts.isCallExpression(grandparent)) {
    return false;
  }
  if (grandparent.expression !== parent) {
    return false;
  }
  const propertyName = parent.name.text;
  if (propertyName !== IN_NAME && propertyName !== AT_NAME) {
    return false;
  }
  return grandparent.arguments.length >= 2;
}
