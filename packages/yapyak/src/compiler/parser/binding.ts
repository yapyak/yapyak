import type {
  BindingPattern,
  BindingRestElement,
  Node,
  ParamPattern,
  Program,
  VariableDeclarator,
} from 'oxc-parser';
import type { SourceFile } from './source-file';

import { collectChildren } from './child';
import { isFunctionLike } from './function-like';

export type Binding = {
  kind: 'direct' | 'namespace' | 'shadow' | 'wrapper';
  localName: string;
};

export type Scope = {
  bindings: Map<string, Binding>;
  kind: 'block' | 'function' | 'module';
  parent?: Scope;
};

export type BindingTable = {
  find(name: string, atNode: Node): Binding | undefined;
  root: Scope;
};

export type ResolveBindingsOptions = {
  ambientParent?: Scope;
};

type ImportData = {
  directLocals: Set<string>;
  namespaceLocals: Set<string>;
};

type WalkContext = {
  scopeByNode: Map<Node, Scope>;
  shadowableNames: Set<string>;
};

export const YAPYAK_MODULE = 'yapyak';
export const YAPYAK_INTERNAL_MODULE = 'yapyak/internal';
export const YAPYAK_DEV_INTERNAL_MODULE = 'yapyak/dev/internal';
export const T_EXPORT = 't';
export const FORMAT_EXPORT = 'format';

export function resolveBindings(
  sourceFile: SourceFile,
  exportName: string,
  options?: ResolveBindingsOptions,
): BindingTable {
  const { program } = sourceFile;
  const imports = extractImports(program, exportName);
  const scopeByNode = new Map<Node, Scope>();
  const root: Scope = {
    bindings: new Map(),
    kind: 'module',
    ...(options?.ambientParent && {
      parent: options.ambientParent,
    }),
  };
  scopeByNode.set(program, root);

  for (const local of imports.directLocals) {
    root.bindings.set(local, {
      kind: 'direct',
      localName: local,
    });
  }
  for (const local of imports.namespaceLocals) {
    root.bindings.set(local, {
      kind: 'namespace',
      localName: local,
    });
  }

  const shadowableNames = new Set<string>([
    ...imports.directLocals,
    ...imports.namespaceLocals,
  ]);
  for (
    let ambientScope = options?.ambientParent;
    ambientScope !== undefined;
    ambientScope = ambientScope.parent
  ) {
    for (const name of ambientScope.bindings.keys()) {
      shadowableNames.add(name);
    }
  }

  const context: WalkContext = {
    scopeByNode,
    shadowableNames,
  };
  for (const child of collectChildren(program)) {
    walkBindings(child, root, context);
  }

  return {
    find: (name, atNode) => findBinding(scopeByNode, name, atNode),
    root,
  };
}

function extractImports(program: Program, exportName: string): ImportData {
  const imports: ImportData = {
    directLocals: new Set(),
    namespaceLocals: new Set(),
  };
  for (const statement of program.body) {
    if (statement.type !== 'ImportDeclaration') {
      continue;
    }
    if (statement.source.value !== YAPYAK_MODULE) {
      continue;
    }
    if (statement.importKind === 'type') {
      continue;
    }
    for (const specifier of statement.specifiers) {
      if (specifier.type === 'ImportNamespaceSpecifier') {
        imports.namespaceLocals.add(specifier.local.name);
        continue;
      }
      if (
        specifier.type === 'ImportDefaultSpecifier' ||
        specifier.importKind === 'type'
      ) {
        continue;
      }
      const importedName =
        specifier.imported.type === 'Literal'
          ? specifier.imported.value
          : specifier.imported.name;
      if (importedName === exportName) {
        imports.directLocals.add(specifier.local.name);
      }
    }
  }
  return imports;
}

function walkBindings(
  node: Node,
  parentScope: Scope,
  context: WalkContext,
): void {
  let scope = parentScope;
  const scopeKind = getScopeKind(node);
  if (scopeKind) {
    scope = {
      bindings: new Map(),
      kind: scopeKind,
      parent: parentScope,
    };
    context.scopeByNode.set(node, scope);
  }

  registerBindings(node, scope, parentScope, context);

  for (const child of collectChildren(node)) {
    walkBindings(child, scope, context);
  }
}

function getScopeKind(node: Node): Scope['kind'] | undefined {
  if (isFunctionLike(node)) {
    return 'function';
  }
  switch (node.type) {
    case 'BlockStatement':
    case 'CatchClause':
    case 'ForInStatement':
    case 'ForOfStatement':
    case 'ForStatement':
    case 'StaticBlock':
      return 'block';
    default:
      return undefined;
  }
}

function registerBindings(
  node: Node,
  scope: Scope,
  parentScope: Scope,
  context: WalkContext,
): void {
  switch (node.type) {
    case 'ArrowFunctionExpression':
    case 'FunctionExpression':
    case 'TSEmptyBodyFunctionExpression':
      registerParameters(node.params, scope, context.shadowableNames);
      return;
    case 'FunctionDeclaration':
    case 'TSDeclareFunction':
      registerParameters(node.params, scope, context.shadowableNames);
      if (node.id) {
        registerShadowName(
          node.id.name,
          findFunctionOrModuleScope(parentScope),
          context.shadowableNames,
        );
      }
      return;
    case 'CatchClause':
      if (node.param) {
        registerShadowPattern(node.param, scope, context.shadowableNames);
      }
      return;
    case 'VariableDeclaration': {
      const targetScope =
        node.kind === 'var' ? findFunctionOrModuleScope(scope) : scope;
      for (const declarator of node.declarations) {
        registerVariableDeclarator(declarator, targetScope, context);
      }
      return;
    }
    case 'ClassDeclaration':
      if (node.id) {
        registerShadowName(node.id.name, parentScope, context.shadowableNames);
      }
      return;
    default:
      return;
  }
}

function registerParameters(
  parameters: ParamPattern[],
  scope: Scope,
  shadowableNames: Set<string>,
): void {
  for (const parameter of parameters) {
    registerShadowPattern(parameter, scope, shadowableNames);
  }
}

function registerShadowPattern(
  pattern: BindingPattern | BindingRestElement | ParamPattern,
  scope: Scope,
  shadowableNames: Set<string>,
): void {
  switch (pattern.type) {
    case 'Identifier':
      registerShadowName(pattern.name, scope, shadowableNames);
      return;
    case 'ObjectPattern':
      for (const property of pattern.properties) {
        registerShadowPattern(
          property.type === 'RestElement' ? property : property.value,
          scope,
          shadowableNames,
        );
      }
      return;
    case 'ArrayPattern':
      for (const element of pattern.elements) {
        if (!element) {
          continue;
        }
        registerShadowPattern(element, scope, shadowableNames);
      }
      return;
    case 'AssignmentPattern':
      registerShadowPattern(pattern.left, scope, shadowableNames);
      return;
    case 'RestElement':
      registerShadowPattern(pattern.argument, scope, shadowableNames);
      return;
    case 'TSParameterProperty':
      registerShadowPattern(pattern.parameter, scope, shadowableNames);
      return;
    default: {
      const exhaustive: never = pattern;
      throw new Error(
        `[yapyak] unknown binding pattern: ${JSON.stringify(exhaustive)}.`,
      );
    }
  }
}

function registerShadowName(
  name: string,
  scope: Scope,
  shadowableNames: Set<string>,
): void {
  if (!shadowableNames.has(name)) {
    return;
  }
  if (scope.bindings.has(name)) {
    return;
  }
  scope.bindings.set(name, {
    kind: 'shadow',
    localName: name,
  });
}

function findFunctionOrModuleScope(scope: Scope): Scope {
  let current: Scope | undefined = scope;
  while (current) {
    if (current.kind === 'function' || current.kind === 'module') {
      return current;
    }
    current = current.parent;
  }
  return scope;
}

function registerVariableDeclarator(
  declarator: VariableDeclarator,
  scope: Scope,
  context: WalkContext,
): void {
  if (
    declarator.id.type === 'Identifier' &&
    declarator.init?.type === 'Identifier'
  ) {
    const target = findBinding(
      context.scopeByNode,
      declarator.init.name,
      declarator,
    );
    if (target) {
      scope.bindings.set(declarator.id.name, {
        kind: target.kind === 'namespace' ? 'namespace' : 'wrapper',
        localName: declarator.id.name,
      });
      return;
    }
  }
  registerShadowPattern(declarator.id, scope, context.shadowableNames);
}

function findBinding(
  scopeByNode: Map<Node, Scope>,
  name: string,
  atNode: Node,
): Binding | undefined {
  let scope = findEnclosingScope(scopeByNode, atNode);
  while (scope) {
    const binding = scope.bindings.get(name);
    if (binding) {
      return binding;
    }
    scope = scope.parent;
  }
  return undefined;
}

function findEnclosingScope(
  scopeByNode: Map<Node, Scope>,
  atNode: Node,
): Scope | undefined {
  let current: Node | null | undefined = atNode;
  while (current) {
    const scope = scopeByNode.get(current);
    if (scope) {
      return scope;
    }
    current = current.parent;
  }
  return undefined;
}
