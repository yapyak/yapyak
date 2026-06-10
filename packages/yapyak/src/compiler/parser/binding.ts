import ts from 'typescript';

export const YAPYAK_MODULE = 'yapyak';
export const YAPYAK_INTERNAL_MODULE = 'yapyak/internal';
export const RUNTIME_NAME = 't';

export interface Binding {
  kind: 'direct' | 'namespace' | 'wrapper';
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

interface ImportData {
  directLocals: Set<string>;
  namespaceLocals: Set<string>;
}

export interface ResolveBindingsOptions {
  ambientParent?: Scope;
}

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

  walkBindings(sourceFile, root, scopeByNode);

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
  scopeByNode: Map<ts.Node, Scope>,
): void {
  let scope = parentScope;
  if (isBlockScopeCreator(node) && !scopeByNode.has(node)) {
    scope = {
      bindings: new Map(),
      node,
      parent: parentScope,
    };
    scopeByNode.set(node, scope);
  }

  if (ts.isVariableStatement(node)) {
    registerVariableDeclarations(node, scope, scopeByNode);
  }

  ts.forEachChild(node, (child) => {
    walkBindings(child, scope, scopeByNode);
  });
}

function isBlockScopeCreator(node: ts.Node): boolean {
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
        kind: 'wrapper',
        localName,
      });
    }
  }
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
