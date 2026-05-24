import type { PlaceholderInfo } from './plural';
import type {
  Diagnostic,
  ExtractedMessage,
  ExtractFileRequest,
  ExtractFileResult,
  Location,
  Placeholder,
} from './type';

import * as ts from 'typescript';

import { resolveCallSiteContext } from './call-site-context';
import { createDiagnostic } from './diagnostic';
import { discoverCalls } from './discover-calls';
import { toMessageId } from './id';
import { parseArguments } from './parse-arguments';
import { parsePlaceholders } from './plural';
import { toRange } from './position';
import { resolveBindings } from './resolve-bindings';

const FACTORY_NAME = '$createT';
const YAPYAK_MODULE = '@yapyak/core';

export function extractFile(request: ExtractFileRequest): ExtractFileResult {
  const sourceFile = createSourceFile(request.fileId, request.source);
  const bindings = resolveBindings(sourceFile);
  const callSites = discoverCalls(sourceFile, bindings);

  const diagnostics: Diagnostic[] = [];
  const messagesById = new Map<string, ExtractedMessage>();

  for (const callSite of callSites) {
    const parsed = parseArguments(callSite);
    diagnostics.push(...parsed.diagnostics);

    if (parsed.source === '') continue;

    const placeholderInfos = parsePlaceholders(parsed.source);
    const placeholders = placeholderInfos.map(toPublicPlaceholder);
    const context = parsed.options?.context;
    const id = toMessageId(parsed.source, context);

    const location: Location = {
      callSiteContext: resolveCallSiteContext(callSite.node, sourceFile),
      fileId: request.fileId,
      range: parsed.sourceRange,
    };
    const factoryLocale = callSite.binding.factoryOptions?.locale;
    if (factoryLocale !== undefined) {
      location.factoryLocale = factoryLocale;
    }

    const existing = messagesById.get(id);
    if (existing !== undefined) {
      existing.locations.push(location);
      continue;
    }

    const message: ExtractedMessage = {
      id,
      locations: [location],
      placeholders,
      source: parsed.source,
    };
    if (context !== undefined) {
      message.context = context;
    }
    messagesById.set(id, message);
  }

  diagnostics.push(
    ...collectFactoryDiagnostics(sourceFile, request.fileId, request.source),
  );
  diagnostics.push(
    ...collectDuplicateContextDiagnostics(
      messagesById,
      request.fileId,
      request.source,
    ),
  );

  return {
    callSites,
    diagnostics,
    messages: Array.from(messagesById.values()),
  };
}

function createSourceFile(fileId: string, source: string): ts.SourceFile {
  return ts.createSourceFile(
    fileId,
    source,
    ts.ScriptTarget.ESNext,
    true,
    getScriptKind(fileId),
  );
}

function getScriptKind(fileId: string): ts.ScriptKind {
  if (fileId.endsWith('.tsx')) return ts.ScriptKind.TSX;
  if (fileId.endsWith('.jsx')) return ts.ScriptKind.JSX;
  if (
    fileId.endsWith('.js') ||
    fileId.endsWith('.mjs') ||
    fileId.endsWith('.cjs')
  ) {
    return ts.ScriptKind.JS;
  }
  return ts.ScriptKind.TS;
}

function toPublicPlaceholder(info: PlaceholderInfo): Placeholder {
  const result: Placeholder = { kind: info.kind, name: info.name };
  if (info.variants !== undefined) {
    result.variants = info.variants;
  }
  return result;
}

function collectFactoryLocals(sourceFile: ts.SourceFile): Set<string> {
  const locals = new Set<string>();
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;
    if (statement.moduleSpecifier.text !== YAPYAK_MODULE) continue;
    const clause = statement.importClause;
    if (clause === undefined) continue;
    const namedBindings = clause.namedBindings;
    if (namedBindings === undefined) continue;
    if (!ts.isNamedImports(namedBindings)) continue;
    for (const element of namedBindings.elements) {
      const importedName = (element.propertyName ?? element.name).text;
      if (importedName === FACTORY_NAME) {
        locals.add(element.name.text);
      }
    }
  }
  return locals;
}

function collectFactoryDiagnostics(
  sourceFile: ts.SourceFile,
  fileId: string,
  fileText: string,
): Diagnostic[] {
  const factoryLocals = collectFactoryLocals(sourceFile);
  if (factoryLocals.size === 0) return [];
  const diagnostics: Diagnostic[] = [];
  walkVariableStatements(sourceFile, (statement) => {
    for (const decl of statement.declarationList.declarations) {
      const init = decl.initializer;
      if (init === undefined) continue;
      if (!ts.isCallExpression(init)) continue;
      if (!ts.isIdentifier(init.expression)) continue;
      if (!factoryLocals.has(init.expression.text)) continue;

      diagnostics.push(
        ...checkFactoryDeclaration({
          fileId,
          fileText,
          initializer: init,
          sourceFile,
          statement,
        }),
      );
    }
  });
  return diagnostics;
}

interface CheckFactoryDeclarationInput {
  fileId: string;
  fileText: string;
  initializer: ts.CallExpression;
  sourceFile: ts.SourceFile;
  statement: ts.VariableStatement;
}

function checkFactoryDeclaration(
  input: CheckFactoryDeclarationInput,
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const { fileId, fileText, initializer, sourceFile, statement } = input;
  const statementRange = toRange(statement, sourceFile);

  const isConst = (statement.declarationList.flags & ts.NodeFlags.Const) !== 0;
  if (!isConst) {
    diagnostics.push(
      createDiagnostic({
        code: 'YPK010',
        fileId,
        hint: 'Change `let` to `const` — $createT bindings must not be reassigned.',
        message: '$createT must be declared with `const`.',
        range: statementRange,
        severity: 'error',
        source: fileText,
      }),
    );
  }

  const isExported = hasExportModifier(statement);
  if (isExported) {
    diagnostics.push(
      createDiagnostic({
        code: 'YPK011',
        fileId,
        hint: 'Move call-sites into this file, or duplicate the $createT declaration where needed.',
        message:
          '$createT bindings cannot be exported. Call-sites must be in the same file as the declaration.',
        range: statementRange,
        severity: 'error',
        source: fileText,
      }),
    );
  }

  const firstArg = initializer.arguments[0];
  if (firstArg !== undefined && !isStaticOptionsObject(firstArg)) {
    diagnostics.push(
      createDiagnostic({
        code: 'YPK004',
        fileId,
        hint: "Pass only string literals — e.g. `$createT({ locale: 'sv' })`.",
        message:
          '$createT options must be statically analyzable string literals.',
        range: toRange(firstArg, sourceFile),
        severity: 'error',
        source: fileText,
      }),
    );
  }

  return diagnostics;
}

function hasExportModifier(statement: ts.VariableStatement): boolean {
  const modifiers = statement.modifiers;
  if (modifiers === undefined) return false;
  for (const modifier of modifiers) {
    if (modifier.kind === ts.SyntaxKind.ExportKeyword) return true;
  }
  return false;
}

function isStaticOptionsObject(arg: ts.Expression): boolean {
  if (!ts.isObjectLiteralExpression(arg)) return false;
  for (const prop of arg.properties) {
    if (!ts.isPropertyAssignment(prop)) return false;
    if (!ts.isIdentifier(prop.name) && !ts.isStringLiteral(prop.name)) {
      return false;
    }
    const initializer = prop.initializer;
    if (
      !ts.isStringLiteral(initializer) &&
      !ts.isNoSubstitutionTemplateLiteral(initializer)
    ) {
      return false;
    }
  }
  return true;
}

function walkVariableStatements(
  node: ts.Node,
  visit: (statement: ts.VariableStatement) => void,
): void {
  if (ts.isVariableStatement(node)) {
    visit(node);
  }
  ts.forEachChild(node, (child) => {
    walkVariableStatements(child, visit);
  });
}

function collectDuplicateContextDiagnostics(
  messagesById: Map<string, ExtractedMessage>,
  fileId: string,
  fileText: string,
): Diagnostic[] {
  const messagesBySource = new Map<string, ExtractedMessage[]>();
  for (const message of messagesById.values()) {
    const existing = messagesBySource.get(message.source);
    if (existing === undefined) {
      messagesBySource.set(message.source, [message]);
      continue;
    }
    existing.push(message);
  }

  const diagnostics: Diagnostic[] = [];
  for (const group of messagesBySource.values()) {
    if (group.length < 2) continue;
    for (const message of group) {
      for (const location of message.locations) {
        diagnostics.push(
          createDiagnostic({
            code: 'YPK009',
            fileId,
            hint: 'If intentional, verify the different contexts; otherwise unify them.',
            message: `Source "${message.source}" appears with multiple contexts. Each context produces a separate translation entry.`,
            range: location.range,
            severity: 'warning',
            source: fileText,
          }),
        );
      }
    }
  }
  return diagnostics;
}
