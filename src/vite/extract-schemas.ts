import ts from 'typescript';

export type SchemaTree = { [key: string]: SchemaTree | string };

export interface ExtractedSchema {
  fileId: string;
  schema: SchemaTree;
  variableName: string | undefined;
}

export function extractSchemas(
  code: string,
  fileId: string,
): ExtractedSchema[] {
  const sourceFile = ts.createSourceFile(
    fileId,
    code,
    ts.ScriptTarget.Latest,
    true,
    detectScriptKind(fileId),
  );
  const aliases = collectAliases(sourceFile);
  if (aliases.size === 0) {
    return [];
  }
  const results: ExtractedSchema[] = [];
  visit(sourceFile);
  return results;

  function visit(node: ts.Node): void {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      aliases.has(node.expression.text) &&
      node.arguments.length === 1
    ) {
      const arg = node.arguments[0];
      if (arg && ts.isObjectLiteralExpression(arg)) {
        const schema = parseObjectLiteral(arg);
        if (schema !== null) {
          results.push({
            fileId,
            schema,
            variableName: findVariableName(node),
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  }
}

function detectScriptKind(fileId: string): ts.ScriptKind {
  if (fileId.endsWith('.tsx')) {
    return ts.ScriptKind.TSX;
  }
  if (fileId.endsWith('.jsx')) {
    return ts.ScriptKind.JSX;
  }
  if (fileId.endsWith('.js') || fileId.endsWith('.mjs') || fileId.endsWith('.cjs')) {
    return ts.ScriptKind.JS;
  }
  return ts.ScriptKind.TS;
}

function collectAliases(sourceFile: ts.SourceFile): Set<string> {
  const aliases = new Set<string>();
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) {
      continue;
    }
    const moduleSpecifier = statement.moduleSpecifier;
    if (!ts.isStringLiteral(moduleSpecifier)) {
      continue;
    }
    if (!isYapyakImport(moduleSpecifier.text)) {
      continue;
    }
    const clause = statement.importClause;
    if (clause === undefined) {
      continue;
    }
    const namedBindings = clause.namedBindings;
    if (namedBindings === undefined || !ts.isNamedImports(namedBindings)) {
      continue;
    }
    for (const element of namedBindings.elements) {
      const importedName = element.propertyName?.text ?? element.name.text;
      if (importedName === 'defineTranslations') {
        aliases.add(element.name.text);
      }
    }
  }
  return aliases;
}

function isYapyakImport(specifier: string): boolean {
  return specifier === 'yapyak' || specifier.startsWith('yapyak/');
}

function findVariableName(call: ts.CallExpression): string | undefined {
  let current: ts.Node = call.parent;
  while (current && !ts.isSourceFile(current)) {
    if (ts.isVariableDeclaration(current) && ts.isIdentifier(current.name)) {
      return current.name.text;
    }
    current = current.parent;
  }
  return undefined;
}

function parseObjectLiteral(
  node: ts.ObjectLiteralExpression,
): SchemaTree | null {
  const result: SchemaTree = {};
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property)) {
      return null;
    }
    const name = readPropertyName(property.name);
    if (name === null) {
      return null;
    }
    const value = readPropertyValue(property.initializer);
    if (value === null) {
      return null;
    }
    result[name] = value;
  }
  return result;
}

function readPropertyName(name: ts.PropertyName): string | null {
  if (ts.isIdentifier(name)) {
    return name.text;
  }
  if (ts.isStringLiteral(name) || ts.isNoSubstitutionTemplateLiteral(name)) {
    return name.text;
  }
  return null;
}

function readPropertyValue(value: ts.Expression): SchemaTree | string | null {
  if (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) {
    return value.text;
  }
  if (ts.isObjectLiteralExpression(value)) {
    return parseObjectLiteral(value);
  }
  return null;
}
