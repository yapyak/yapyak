import type { BindingTable, Scope, StaticOptions, YapyakBinding } from './type';

import * as ts from 'typescript';

const YAPYAK_MODULE = '@yapyak/core';
const RUNTIME_NAME = '$t';
const FACTORY_NAME = '$createT';

interface ImportInfo {
  directLocals: Map<string, ts.Node>;
  factoryLocals: Map<string, ts.Node>;
  namespaceLocals: Map<string, ts.Node>;
}

export function resolveBindings(sourceFile: ts.SourceFile): BindingTable {
  const imports = collectImports(sourceFile);
  const scopeByNode = new Map<ts.Node, Scope>();
  const root: Scope = { bindings: new Map(), node: sourceFile };
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

  walkBindings(sourceFile, root, scopeByNode, imports);

  return {
    find: (name, atNode) => findBinding(scopeByNode, name, atNode),
    root,
  };
}

function collectImports(sourceFile: ts.SourceFile): ImportInfo {
  const info: ImportInfo = {
    directLocals: new Map(),
    factoryLocals: new Map(),
    namespaceLocals: new Map(),
  };
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;
    if (statement.moduleSpecifier.text !== YAPYAK_MODULE) continue;
    const clause = statement.importClause;
    if (clause === undefined) continue;
    const namedBindings = clause.namedBindings;
    if (namedBindings === undefined) continue;
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
        } else if (importedName === FACTORY_NAME) {
          info.factoryLocals.set(localName, element);
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
  imports: ImportInfo,
): void {
  let scope = parentScope;
  if (createsBlockScope(node) && !scopeByNode.has(node)) {
    scope = { bindings: new Map(), node, parent: parentScope };
    scopeByNode.set(node, scope);
  }

  if (ts.isVariableStatement(node)) {
    registerVariableDeclarations(node, scope, scopeByNode, imports);
  }

  ts.forEachChild(node, (child) => {
    walkBindings(child, scope, scopeByNode, imports);
  });
}

function createsBlockScope(node: ts.Node): boolean {
  return ts.isBlock(node);
}

function registerVariableDeclarations(
  statement: ts.VariableStatement,
  scope: Scope,
  scopeByNode: Map<ts.Node, Scope>,
  imports: ImportInfo,
): void {
  for (const decl of statement.declarationList.declarations) {
    if (!ts.isIdentifier(decl.name)) continue;
    const localName = decl.name.text;
    const init = decl.initializer;
    if (init === undefined) continue;

    if (ts.isIdentifier(init)) {
      const target = findBinding(scopeByNode, init.text, decl);
      if (target === undefined) continue;
      const wrapper: YapyakBinding = {
        declarationNode: decl,
        kind: 'wrapper',
        localName,
      };
      if (target.factoryOptions !== undefined) {
        wrapper.factoryOptions = target.factoryOptions;
      }
      scope.bindings.set(localName, wrapper);
      continue;
    }

    if (ts.isCallExpression(init) && ts.isIdentifier(init.expression)) {
      const calleeName = init.expression.text;
      if (!imports.factoryLocals.has(calleeName)) continue;
      const binding: YapyakBinding = {
        declarationNode: decl,
        kind: 'factory',
        localName,
      };
      const firstArg = init.arguments[0];
      const factoryOptions =
        firstArg === undefined ? {} : extractStaticOptions(firstArg);
      if (factoryOptions !== undefined) {
        binding.factoryOptions = factoryOptions;
      }
      scope.bindings.set(localName, binding);
    }
  }
}

function extractStaticOptions(arg: ts.Expression): StaticOptions | undefined {
  if (!ts.isObjectLiteralExpression(arg)) return undefined;
  const options: StaticOptions = {};
  for (const prop of arg.properties) {
    if (!ts.isPropertyAssignment(prop)) return undefined;
    if (!ts.isIdentifier(prop.name) && !ts.isStringLiteral(prop.name)) {
      return undefined;
    }
    const name = prop.name.text;
    const initializer = prop.initializer;
    if (
      !ts.isStringLiteral(initializer) &&
      !ts.isNoSubstitutionTemplateLiteral(initializer)
    ) {
      return undefined;
    }
    if (name === 'context') {
      options.context = initializer.text;
    } else if (name === 'locale') {
      options.locale = initializer.text;
    } else {
      return undefined;
    }
  }
  return options;
}

function findBinding(
  scopeByNode: Map<ts.Node, Scope>,
  name: string,
  atNode: ts.Node,
): YapyakBinding | undefined {
  let scope = findEnclosingScope(scopeByNode, atNode);
  while (scope !== undefined) {
    const binding = scope.bindings.get(name);
    if (binding !== undefined) return binding;
    scope = scope.parent;
  }
  return undefined;
}

function findEnclosingScope(
  scopeByNode: Map<ts.Node, Scope>,
  atNode: ts.Node,
): Scope | undefined {
  let current: ts.Node | undefined = atNode;
  while (current !== undefined) {
    const scope = scopeByNode.get(current);
    if (scope !== undefined) return scope;
    current = current.parent;
  }
  return undefined;
}
