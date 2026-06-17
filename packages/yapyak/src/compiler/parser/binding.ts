import ts from 'typescript';

export type Binding = {
  kind: 'direct' | 'namespace' | 'shadow' | 'wrapper';
  localName: string;
};

export type Scope = {
  bindings: Map<string, Binding>;
  node: ts.Node;
  parent?: Scope;
};

export type BindingTable = {
  find(name: string, atNode: ts.Node): Binding | undefined;
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
  scopeByNode: Map<ts.Node, Scope>;
  shadowableNames: Set<string>;
};

export const YAPYAK_MODULE = 'yapyak';
export const YAPYAK_INTERNAL_MODULE = 'yapyak/internal';
export const RUNTIME_NAME = 't';

export function resolveBindings(
  sourceFile: ts.SourceFile,
  options?: ResolveBindingsOptions,
): BindingTable {
  const imports = extractImports(sourceFile);
  const scopeByNode = new Map<ts.Node, Scope>();
  const root: Scope = {
    bindings: new Map(),
    node: sourceFile,
    ...(options?.ambientParent && {
      parent: options.ambientParent,
    }),
  };
  scopeByNode.set(sourceFile, root);

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

  walkBindings(sourceFile, root, {
    scopeByNode,
    shadowableNames,
  });

  return {
    find: (name, atNode) => findBinding(scopeByNode, name, atNode),
    root,
  };
}

function extractImports(sourceFile: ts.SourceFile): ImportData {
  const imports: ImportData = {
    directLocals: new Set(),
    namespaceLocals: new Set(),
  };
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) {
      continue;
    }
    if (!ts.isStringLiteral(statement.moduleSpecifier)) {
      continue;
    }
    if (statement.moduleSpecifier.text !== YAPYAK_MODULE) {
      continue;
    }
    const clause = statement.importClause;
    if (!clause) {
      continue;
    }
    const namedBindings = clause.namedBindings;
    if (!namedBindings) {
      continue;
    }
    if (ts.isNamespaceImport(namedBindings)) {
      imports.namespaceLocals.add(namedBindings.name.text);
      continue;
    }
    if (ts.isNamedImports(namedBindings)) {
      for (const element of namedBindings.elements) {
        const importedName = (element.propertyName ?? element.name).text;
        const localName = element.name.text;
        if (importedName === RUNTIME_NAME) {
          imports.directLocals.add(localName);
        }
      }
    }
  }
  return imports;
}

function walkBindings(
  node: ts.Node,
  parentScope: Scope,
  context: WalkContext,
): void {
  let scope = parentScope;
  if (isScopeCreator(node) && !context.scopeByNode.has(node)) {
    scope = {
      bindings: new Map(),
      node,
      parent: parentScope,
    };
    context.scopeByNode.set(node, scope);
  }

  registerBindings(node, scope, parentScope, context);

  ts.forEachChild(node, (child) => {
    walkBindings(child, scope, context);
  });
}

function isScopeCreator(node: ts.Node): boolean {
  return (
    ts.isBlock(node) ||
    ts.isFunctionLike(node) ||
    ts.isCatchClause(node) ||
    ts.isForStatement(node) ||
    ts.isForInStatement(node) ||
    ts.isForOfStatement(node)
  );
}

function registerBindings(
  node: ts.Node,
  scope: Scope,
  parentScope: Scope,
  context: WalkContext,
): void {
  if (ts.isParameter(node)) {
    registerShadowPattern(node.name, scope, context.shadowableNames);
    return;
  }
  if (ts.isCatchClause(node) && node.variableDeclaration) {
    registerShadowPattern(
      node.variableDeclaration.name,
      scope,
      context.shadowableNames,
    );
    return;
  }
  if (ts.isVariableStatement(node)) {
    const flags = node.declarationList.flags;
    const isVar = !(
      flags &
      (ts.NodeFlags.Let | ts.NodeFlags.Const | ts.NodeFlags.Using)
    );
    const targetScope = isVar ? findFunctionOrModuleScope(scope) : scope;
    for (const decl of node.declarationList.declarations) {
      registerVariableDeclaration(decl, targetScope, context);
    }
    return;
  }
  if (ts.isFunctionDeclaration(node) && node.name) {
    const targetScope = findFunctionOrModuleScope(parentScope);
    registerShadowName(node.name.text, targetScope, context.shadowableNames);
    return;
  }
  if (ts.isClassDeclaration(node) && node.name) {
    registerShadowName(node.name.text, parentScope, context.shadowableNames);
    return;
  }
  if (ts.isForInStatement(node) || ts.isForOfStatement(node)) {
    const initializer = node.initializer;
    if (ts.isVariableDeclarationList(initializer)) {
      for (const decl of initializer.declarations) {
        registerVariableDeclaration(decl, scope, context);
      }
    }
    return;
  }
  if (ts.isForStatement(node) && node.initializer) {
    const initializer = node.initializer;
    if (ts.isVariableDeclarationList(initializer)) {
      for (const decl of initializer.declarations) {
        registerVariableDeclaration(decl, scope, context);
      }
    }
  }
}

function registerVariableDeclaration(
  decl: ts.VariableDeclaration,
  scope: Scope,
  context: WalkContext,
): void {
  if (
    ts.isIdentifier(decl.name) &&
    decl.initializer &&
    ts.isIdentifier(decl.initializer)
  ) {
    const target = findBinding(
      context.scopeByNode,
      decl.initializer.text,
      decl,
    );
    if (target) {
      scope.bindings.set(decl.name.text, {
        kind: target.kind === 'namespace' ? 'namespace' : 'wrapper',
        localName: decl.name.text,
      });
      return;
    }
  }
  registerShadowPattern(decl.name, scope, context.shadowableNames);
}

function registerShadowPattern(
  name: ts.BindingName,
  scope: Scope,
  shadowableNames: Set<string>,
): void {
  if (ts.isIdentifier(name)) {
    registerShadowName(name.text, scope, shadowableNames);
    return;
  }
  for (const element of name.elements) {
    if (ts.isOmittedExpression(element)) {
      continue;
    }
    registerShadowPattern(element.name, scope, shadowableNames);
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
    if (ts.isSourceFile(current.node) || ts.isFunctionLike(current.node)) {
      return current;
    }
    current = current.parent;
  }
  return scope;
}

function findBinding(
  scopeByNode: Map<ts.Node, Scope>,
  name: string,
  atNode: ts.Node,
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
  scopeByNode: Map<ts.Node, Scope>,
  atNode: ts.Node,
): Scope | undefined {
  let current: ts.Node | undefined = atNode;
  while (current) {
    const scope = scopeByNode.get(current);
    if (scope) {
      return scope;
    }
    current = current.parent;
  }
  return undefined;
}
