import * as ts from 'typescript';

export interface Binding {
  declarationNode: ts.Node;
  kind: 'direct' | 'namespace' | 'scoped' | 'wrapper';
  localeExpression?: ts.Expression;
  localName: string;
}

export interface Scope {
  bindings: Map<string, Binding>;
  node: ts.Node;
  parent?: Scope;
}

export interface BindingTable {
  find(name: string, atNode: ts.Node): Binding | undefined;
  root: Scope;
}

const YAPYAK_MODULE = 'yapyak';
const RUNTIME_NAME = 't';
const SCOPE_NAME = 'in';

interface ImportInfo {
  directLocals: Map<string, ts.Node>;
  namespaceLocals: Map<string, ts.Node>;
}

export interface ResolveBindingsOptions {
  ambientParent?: Scope;
}

export function resolveBindings(
  sourceFile: ts.SourceFile,
  options?: ResolveBindingsOptions,
): BindingTable {
  const imports = collectImports(sourceFile);
  const scopeByNode = new Map<ts.Node, Scope>();
  const root: Scope = {
    bindings: new Map(),
    node: sourceFile,
    ...(options?.ambientParent && {
      parent: options.ambientParent,
    }),
  };
  scopeByNode.set(sourceFile, root);

  for (const [local, declarationNode] of imports.directLocals) {
    root.bindings.set(local, {
      declarationNode,
      kind: 'direct',
      localName: local,
    });
  }
  for (const [local, declarationNode] of imports.namespaceLocals) {
    root.bindings.set(local, {
      declarationNode,
      kind: 'namespace',
      localName: local,
    });
  }

  walkBindings(sourceFile, root, scopeByNode);

  return {
    find: (name, atNode) => findBinding(scopeByNode, name, atNode),
    root,
  };
}

function collectImports(sourceFile: ts.SourceFile): ImportInfo {
  const info: ImportInfo = {
    directLocals: new Map(),
    namespaceLocals: new Map(),
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
      info.namespaceLocals.set(namedBindings.name.text, namedBindings);
      continue;
    }
    if (ts.isNamedImports(namedBindings)) {
      for (const element of namedBindings.elements) {
        const importedName = (element.propertyName ?? element.name).text;
        const localName = element.name.text;
        if (importedName === RUNTIME_NAME) {
          info.directLocals.set(localName, element);
        }
      }
    }
  }
  return info;
}

function walkBindings(
  node: ts.Node,
  parentScope: Scope,
  scopeByNode: Map<ts.Node, Scope>,
): void {
  let scope = parentScope;
  if (createsBlockScope(node) && !scopeByNode.has(node)) {
    scope = { bindings: new Map(), node, parent: parentScope };
    scopeByNode.set(node, scope);
  }

  if (ts.isVariableStatement(node)) {
    registerVariableDeclarations(node, scope, scopeByNode);
  }

  ts.forEachChild(node, (child) => {
    walkBindings(child, scope, scopeByNode);
  });
}

function createsBlockScope(node: ts.Node): boolean {
  return ts.isBlock(node);
}

function registerVariableDeclarations(
  statement: ts.VariableStatement,
  scope: Scope,
  scopeByNode: Map<ts.Node, Scope>,
): void {
  for (const decl of statement.declarationList.declarations) {
    if (!ts.isIdentifier(decl.name)) {
      continue;
    }
    const localName = decl.name.text;
    const init = decl.initializer;
    if (!init) {
      continue;
    }
    if (ts.isIdentifier(init)) {
      const target = findBinding(scopeByNode, init.text, decl);
      if (!target) {
        continue;
      }
      scope.bindings.set(localName, {
        declarationNode: decl,
        kind: 'wrapper',
        localName,
      });
      continue;
    }
    const localeExpression = readScopedInit(init, decl, scopeByNode);
    if (localeExpression) {
      scope.bindings.set(localName, {
        declarationNode: decl,
        kind: 'scoped',
        localeExpression,
        localName,
      });
    }
  }
}

function readScopedInit(
  init: ts.Expression,
  atNode: ts.Node,
  scopeByNode: Map<ts.Node, Scope>,
): ts.Expression | undefined {
  if (!ts.isCallExpression(init)) {
    return undefined;
  }
  const callee = init.expression;
  if (!ts.isPropertyAccessExpression(callee)) {
    return undefined;
  }
  if (callee.name.text !== SCOPE_NAME) {
    return undefined;
  }
  if (!ts.isIdentifier(callee.expression)) {
    return undefined;
  }
  const target = findBinding(scopeByNode, callee.expression.text, atNode);
  if (!target || target.kind === 'namespace') {
    return undefined;
  }
  return init.arguments[0];
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
