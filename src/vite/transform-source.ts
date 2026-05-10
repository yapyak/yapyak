import ts from 'typescript';

export interface LocaleData {
  [locale: string]: {
    [fileId: string]: { [key: string]: string };
  };
}

export interface TransformOptions {
  defaultLocale: string;
  fileId: string;
  helperImport?: string;
  localeData: LocaleData;
  locales: string[];
}

export interface TransformResult {
  code: string;
}

const HELPER_NAME = '__yapyak_withLocale';
const DEFAULT_HELPER_IMPORT = 'yapyak/with-locale';

const FRAMEWORK_HELPER_IMPORT: Record<string, string> = {
  'yapyak/react': 'yapyak/react/with-locale',
  'yapyak/svelte': 'yapyak/svelte/with-locale',
  'yapyak/vue': 'yapyak/vue/with-locale',
};

interface CallSite {
  end: number;
  schema: FlatSchema;
  start: number;
}

type FlatSchema = { [key: string]: string };

export function transformSource(
  code: string,
  options: TransformOptions,
): TransformResult | null {
  const sourceFile = ts.createSourceFile(
    options.fileId,
    code,
    ts.ScriptTarget.Latest,
    true,
    detectScriptKind(options.fileId),
  );
  const detected = collectDefineTranslationsAliases(sourceFile);
  if (detected.aliases.size === 0) {
    return null;
  }
  const callSites: CallSite[] = [];
  visit(sourceFile);
  if (callSites.length === 0) {
    return null;
  }

  callSites.sort((a, b) => b.start - a.start);
  let next = code;
  for (const site of callSites) {
    const compiled = compileCallExpression(site.schema, options);
    next = `${next.slice(0, site.start)}${compiled}${next.slice(site.end)}`;
  }
  const helperImport =
    options.helperImport ??
    FRAMEWORK_HELPER_IMPORT[detected.importPath] ??
    DEFAULT_HELPER_IMPORT;
  const importStatement = `import { withLocale as ${HELPER_NAME} } from '${helperImport}';\n`;
  return { code: importStatement + next };

  function visit(node: ts.Node): void {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      detected.aliases.has(node.expression.text) &&
      node.arguments.length === 1
    ) {
      const arg = node.arguments[0];
      if (arg && ts.isObjectLiteralExpression(arg)) {
        const schema = parseFlatSchema(arg);
        if (schema !== null) {
          callSites.push({
            end: node.getEnd(),
            schema,
            start: node.getStart(sourceFile),
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  }
}

function compileCallExpression(
  schema: FlatSchema,
  options: TransformOptions,
): string {
  const variants: Record<string, Record<string, string>> = {};
  for (const [key, sourceValue] of Object.entries(schema)) {
    const perLocale: Record<string, string> = {};
    for (const locale of options.locales) {
      const value = readLocaleValue(options.localeData, locale, options.fileId, key);
      perLocale[locale] = value ?? sourceValue;
    }
    variants[key] = perLocale;
  }
  return `${HELPER_NAME}(${stringifyVariants(variants)})`;
}

function stringifyVariants(
  variants: Record<string, Record<string, string>>,
): string {
  const parts: string[] = [];
  for (const [key, perLocale] of Object.entries(variants)) {
    const localeParts: string[] = [];
    for (const [locale, value] of Object.entries(perLocale)) {
      localeParts.push(`${quoteIdentifier(locale)}: ${quoteString(value)}`);
    }
    parts.push(`${quoteIdentifier(key)}: { ${localeParts.join(', ')} }`);
  }
  return `{ ${parts.join(', ')} }`;
}

function quoteIdentifier(value: string): string {
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value)) {
    return value;
  }
  return quoteString(value);
}

function quoteString(value: string): string {
  return JSON.stringify(value);
}

function readLocaleValue(
  data: LocaleData,
  locale: string,
  fileId: string,
  key: string,
): string | undefined {
  const localeFile = data[locale];
  if (localeFile === undefined) {
    return undefined;
  }
  const fileEntries = localeFile[fileId];
  if (fileEntries === undefined) {
    return undefined;
  }
  const value = fileEntries[key];
  if (typeof value !== 'string' || value === '') {
    return undefined;
  }
  return value;
}

interface DetectedAliases {
  aliases: Set<string>;
  importPath: string;
}

function collectDefineTranslationsAliases(
  sourceFile: ts.SourceFile,
): DetectedAliases {
  const aliases = new Set<string>();
  let importPath = '';
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
        if (importPath === '') {
          importPath = moduleSpecifier.text;
        }
      }
    }
  }
  return { aliases, importPath };
}

function isYapyakImport(specifier: string): boolean {
  return specifier === 'yapyak' || specifier.startsWith('yapyak/');
}

function parseFlatSchema(
  node: ts.ObjectLiteralExpression,
): FlatSchema | null {
  const result: FlatSchema = {};
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property)) {
      return null;
    }
    const name = readPropertyName(property.name);
    if (name === null) {
      return null;
    }
    const initializer = property.initializer;
    if (
      !ts.isStringLiteral(initializer) &&
      !ts.isNoSubstitutionTemplateLiteral(initializer)
    ) {
      return null;
    }
    result[name] = initializer.text;
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

function detectScriptKind(fileId: string): ts.ScriptKind {
  if (fileId.endsWith('.tsx')) {
    return ts.ScriptKind.TSX;
  }
  if (fileId.endsWith('.jsx')) {
    return ts.ScriptKind.JSX;
  }
  if (
    fileId.endsWith('.js') ||
    fileId.endsWith('.mjs') ||
    fileId.endsWith('.cjs')
  ) {
    return ts.ScriptKind.JS;
  }
  return ts.ScriptKind.TS;
}
