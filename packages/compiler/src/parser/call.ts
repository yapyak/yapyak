import type { Binding, BindingTable } from './binding';
import type { ElisionContext } from './fragment';
import type { Range } from './range';

import * as ts from 'typescript';

import { toRange } from './range';

export interface CallSite {
  binding: Binding;
  elision?: ElisionContext;
  localeExpression?: ts.Expression;
  node: ts.CallExpression;
  range: Range;
}

const RUNTIME_NAME = 't';
const SCOPE_NAME = 'in';

interface ResolvedCall {
  binding: Binding;
  localeExpression?: ts.Expression;
}

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
    const resolved = resolveCallee(node, bindings);
    if (resolved) {
      out.push({
        binding: resolved.binding,
        node,
        range: toRange(node, sourceFile),
        ...(resolved.localeExpression && {
          localeExpression: resolved.localeExpression,
        }),
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
): ResolvedCall | undefined {
  const callee = call.expression;
  if (ts.isIdentifier(callee)) {
    const binding = bindings.find(callee.text, call);
    if (!binding || binding.kind === 'namespace') {
      return undefined;
    }
    if (binding.kind === 'scoped') {
      return { binding, localeExpression: binding.localeExpression };
    }
    return { binding };
  }
  if (
    ts.isPropertyAccessExpression(callee) &&
    ts.isIdentifier(callee.expression)
  ) {
    const namespaceBinding = bindings.find(callee.expression.text, call);
    if (!namespaceBinding || namespaceBinding.kind !== 'namespace') {
      return undefined;
    }
    if (callee.name.text !== RUNTIME_NAME) {
      return undefined;
    }
    return { binding: namespaceBinding };
  }
  if (ts.isCallExpression(callee)) {
    return resolveInlineScoped(callee, call, bindings);
  }
  return undefined;
}

function resolveInlineScoped(
  inner: ts.CallExpression,
  call: ts.CallExpression,
  bindings: BindingTable,
): ResolvedCall | undefined {
  const innerCallee = inner.expression;
  if (!ts.isPropertyAccessExpression(innerCallee)) {
    return undefined;
  }
  if (innerCallee.name.text !== SCOPE_NAME) {
    return undefined;
  }
  if (!ts.isIdentifier(innerCallee.expression)) {
    return undefined;
  }
  const binding = bindings.find(innerCallee.expression.text, call);
  if (!binding || binding.kind === 'namespace') {
    return undefined;
  }
  return { binding, localeExpression: inner.arguments[0] };
}
