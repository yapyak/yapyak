import type { Binding, BindingTable } from './binding';
import type { ElisionContext } from './fragment';
import type { Range } from './range';

import * as ts from 'typescript';

import { toRange } from './range';

export type CallVariant = 'at' | 't';

export interface CallSite {
  binding: Binding;
  elision?: ElisionContext;
  localeExpression?: ts.Expression;
  node: ts.CallExpression;
  range: Range;
  variant: CallVariant;
}

const RUNTIME_NAME = 't';
const SCOPE_NAME = 'in';
const AT_NAME = 'at';

interface ResolvedCall {
  binding: Binding;
  localeExpression?: ts.Expression;
  variant: CallVariant;
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
        variant: resolved.variant,
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
      return {
        binding,
        localeExpression: binding.localeExpression,
        variant: 't',
      };
    }
    return { binding, variant: 't' };
  }
  if (ts.isPropertyAccessExpression(callee)) {
    return resolvePropertyCallee(callee, call, bindings);
  }
  if (ts.isCallExpression(callee)) {
    return resolveInlineScoped(callee, call, bindings);
  }
  return undefined;
}

function resolvePropertyCallee(
  callee: ts.PropertyAccessExpression,
  call: ts.CallExpression,
  bindings: BindingTable,
): ResolvedCall | undefined {
  const methodName = callee.name.text;
  const receiver = callee.expression;

  if (ts.isIdentifier(receiver)) {
    const binding = bindings.find(receiver.text, call);
    if (!binding) {
      return undefined;
    }
    if (binding.kind === 'namespace' && methodName === RUNTIME_NAME) {
      return { binding, variant: 't' };
    }
    if (binding.kind !== 'namespace' && methodName === AT_NAME) {
      return { binding, variant: 'at' };
    }
    return undefined;
  }

  if (
    ts.isPropertyAccessExpression(receiver) &&
    ts.isIdentifier(receiver.expression) &&
    receiver.name.text === RUNTIME_NAME &&
    methodName === AT_NAME
  ) {
    const binding = bindings.find(receiver.expression.text, call);
    if (binding?.kind === 'namespace') {
      return { binding, variant: 'at' };
    }
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
  return {
    binding,
    localeExpression: inner.arguments[0],
    variant: 't',
  };
}
