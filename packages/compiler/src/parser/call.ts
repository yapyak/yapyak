import type { BindingTable, CallSite } from './type';

import * as ts from 'typescript';

import { toRange } from './range';

const RUNTIME_NAME = 't';

export function discoverCalls(
  sourceFile: ts.SourceFile,
  bindings: BindingTable,
): CallSite[] {
  const callSites: CallSite[] = [];
  walk(sourceFile, sourceFile, bindings, callSites);
  return callSites;
}

function walk(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  bindings: BindingTable,
  out: CallSite[],
): void {
  if (ts.isCallExpression(node)) {
    const binding = resolveCallee(node, bindings);
    if (binding) {
      out.push({
        binding,
        node,
        range: toRange(node, sourceFile),
      });
    }
  }
  ts.forEachChild(node, (child) => {
    walk(child, sourceFile, bindings, out);
  });
}

function resolveCallee(
  call: ts.CallExpression,
  bindings: BindingTable,
): CallSite['binding'] | undefined {
  const callee = call.expression;
  if (ts.isIdentifier(callee)) {
    const binding = bindings.find(callee.text, call);
    if (!binding) {
      return undefined;
    }
    if (binding.kind === 'namespace') {
      return undefined;
    }
    return binding;
  }
  if (
    ts.isPropertyAccessExpression(callee) &&
    ts.isIdentifier(callee.expression)
  ) {
    const namespaceBinding = bindings.find(callee.expression.text, call);
    if (!namespaceBinding) {
      return undefined;
    }
    if (namespaceBinding.kind !== 'namespace') {
      return undefined;
    }
    if (callee.name.text !== RUNTIME_NAME) {
      return undefined;
    }
    return namespaceBinding;
  }
  return undefined;
}
