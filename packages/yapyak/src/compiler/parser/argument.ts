import type { Range } from '../../processor';
import type { CallSite } from './call';
import type { Diagnostic } from './diagnostic';
import type { IcuIssue } from './placeholder';

import ts from 'typescript';

import { createDiagnostic } from './diagnostic';
import { parsePlaceholders } from './placeholder';
import { toRange } from './range';

export interface ParsedParams {
  keys: string[];
  kind: 'spread' | 'static';
  range: Range;
}

export interface ParsedArguments {
  context?: string;
  diagnostics: Diagnostic[];
  params?: ParsedParams;
  source: string;
  sourceRange: Range;
}

const CONTEXT_SEPARATOR = '@';

export function parseArguments(callSite: CallSite): ParsedArguments {
  const sourceFile = callSite.node.getSourceFile();
  const fileText = sourceFile.text;
  const fileId = sourceFile.fileName;
  const diagnostics: Diagnostic[] = [];

  let context: string | undefined;

  if (callSite.contextArg) {
    const contextArg = callSite.contextArg;
    if (
      ts.isStringLiteral(contextArg) ||
      ts.isNoSubstitutionTemplateLiteral(contextArg)
    ) {
      const text = contextArg.text;
      if (text.includes(CONTEXT_SEPARATOR)) {
        diagnostics.push(
          createDiagnostic({
            code: 'YPK402',
            fileId,
            hint: "Remove the '@' — it is reserved as the source/context separator.",
            message: `\`t.as()\` context \`'${text}'\` must not contain \`'@'\`.`,
            range: toRange(contextArg, sourceFile),
            severity: 'error',
            source: fileText,
          }),
        );
      } else {
        context = text;
      }
    } else {
      diagnostics.push(
        createDiagnostic({
          code: 'YPK401',
          fileId,
          hint: 'Pass a static string literal as the context argument.',
          message: '`t.as()` context argument must be a static string literal.',
          range: toRange(contextArg, sourceFile),
          severity: 'error',
          source: fileText,
        }),
      );
    }
  }

  const sourceArg = callSite.sourceArg;
  if (!sourceArg) {
    diagnostics.push(
      createDiagnostic({
        code: 'YPK101',
        fileId,
        message: callSite.contextArg
          ? 't.as() called without source string.'
          : 't() called without arguments.',
        range: toRange(callSite.node, sourceFile),
        severity: 'error',
        source: fileText,
      }),
    );
    const result: ParsedArguments = {
      diagnostics,
      source: '',
      sourceRange: toRange(callSite.node, sourceFile),
    };
    if (context !== undefined) {
      result.context = context;
    }
    return result;
  }

  const sourceRange = toRange(sourceArg, sourceFile);
  if (!isLiteralFirstArg(sourceArg)) {
    diagnostics.push(
      createDiagnostic({
        code: 'YPK102',
        fileId,
        // biome-ignore lint/suspicious/noTemplateCurlyInString: yap yap yap
        hint: "Replace `t(`Hi ${name}`)` with `t('Hi {name}', { name })`.",
        message:
          'Dynamic source string in t(). Use a plain string literal with `{placeholder}` syntax.',
        range: sourceRange,
        severity: 'error',
        source: fileText,
      }),
    );
    const result: ParsedArguments = { diagnostics, source: '', sourceRange };
    if (context !== undefined) {
      result.context = context;
    }
    return result;
  }

  const source = sourceArg.text;
  if (source === '') {
    diagnostics.push(
      createDiagnostic({
        code: 'YPK103',
        fileId,
        message: 't() called with empty source string.',
        range: sourceRange,
        severity: 'error',
        source: fileText,
      }),
    );
  }

  const { issues, placeholders } = parsePlaceholders(source);
  const placeholderKeys = placeholders.map((placeholder) => placeholder.name);
  const hasPlaceholders = placeholderKeys.length > 0;

  for (const issue of issues) {
    diagnostics.push(
      toIcuDiagnostic(issue, { fileId, fileText, range: sourceRange }),
    );
  }

  let params: ParsedParams | undefined;
  const paramArg = callSite.paramsArg;
  if (paramArg) {
    params = parseParams(paramArg, sourceFile);
  }
  if (hasPlaceholders || paramArg) {
    validateParams({
      callSite,
      diagnostics,
      fileId,
      fileText,
      paramArgPresent: paramArg !== undefined,
      params,
      placeholderKeys,
    });
  }

  const result: ParsedArguments = { diagnostics, source, sourceRange };
  if (context !== undefined) {
    result.context = context;
  }
  if (params) {
    result.params = params;
  }
  return result;
}

interface IcuDiagnosticContext {
  fileId: string;
  fileText: string;
  range: Range;
}

function toIcuDiagnostic(
  issue: IcuIssue,
  context: IcuDiagnosticContext,
): Diagnostic {
  if (issue.reason === 'missing-other') {
    return createDiagnostic({
      code: 'YPK202',
      fileId: context.fileId,
      hint: 'Add an `other {<text>}` branch — plural, selectordinal, and select all require an `other` fallback.',
      message: `Placeholder '{${issue.name}}' is missing the required 'other' branch.`,
      range: context.range,
      severity: 'error',
      source: context.fileText,
    });
  }
  if (issue.reason === 'malformed') {
    return createDiagnostic({
      code: 'YPK201',
      fileId: context.fileId,
      hint: 'Check the ICU syntax — every `{` needs a matching `}`.',
      message: `Malformed ICU message (${issue.message}).`,
      range: context.range,
      severity: 'error',
      source: context.fileText,
    });
  }
  return createDiagnostic({
    code: 'YPK203',
    fileId: context.fileId,
    hint: 'Use a supported ICU feature, or format the value before passing it in.',
    message: issue.name
      ? `Unsupported ICU feature in '{${issue.name}}': ${issue.feature}.`
      : `Unsupported ICU feature: ${issue.feature}.`,
    range: context.range,
    severity: 'error',
    source: context.fileText,
  });
}

function isLiteralFirstArg(
  expression: ts.Expression,
): expression is ts.NoSubstitutionTemplateLiteral | ts.StringLiteral {
  return (
    ts.isStringLiteral(expression) ||
    ts.isNoSubstitutionTemplateLiteral(expression)
  );
}

function parseParams(
  expression: ts.Expression,
  sourceFile: ts.SourceFile,
): ParsedParams | undefined {
  if (!ts.isObjectLiteralExpression(expression)) {
    return undefined;
  }
  const keys: string[] = [];
  let kind: 'spread' | 'static' = 'static';
  for (const property of expression.properties) {
    if (ts.isSpreadAssignment(property)) {
      kind = 'spread';
      continue;
    }
    if (
      ts.isShorthandPropertyAssignment(property) ||
      ts.isPropertyAssignment(property)
    ) {
      if (ts.isIdentifier(property.name)) {
        keys.push(property.name.text);
        continue;
      }
      if (ts.isStringLiteral(property.name)) {
        keys.push(property.name.text);
        continue;
      }
    }
    kind = 'spread';
  }
  return { keys, kind, range: toRange(expression, sourceFile) };
}

interface ValidateParamsInput {
  callSite: CallSite;
  diagnostics: Diagnostic[];
  fileId: string;
  fileText: string;
  paramArgPresent: boolean;
  params: ParsedParams | undefined;
  placeholderKeys: string[];
}

function validateParams(input: ValidateParamsInput): void {
  const {
    callSite,
    diagnostics,
    fileId,
    fileText,
    paramArgPresent: hasParamArg,
    params,
    placeholderKeys,
  } = input;
  const sourceFile = callSite.node.getSourceFile();
  const callRange = toRange(callSite.node, sourceFile);

  if (!params) {
    if (hasParamArg) {
      diagnostics.push(
        createDiagnostic({
          code: 'YPK106',
          fileId,
          hint: 'Pass params as an inline object literal to enable validation.',
          message: 'Params passed dynamically cannot be statically verified.',
          range: callRange,
          severity: 'warning',
          source: fileText,
        }),
      );
      return;
    }
    for (const key of placeholderKeys) {
      diagnostics.push(
        createDiagnostic({
          code: 'YPK104',
          fileId,
          hint: `Add { ${key}: ... } as the second argument.`,
          message: `Missing parameter '${key}' for placeholder '{${key}}'.`,
          range: callRange,
          severity: 'error',
          source: fileText,
        }),
      );
    }
    return;
  }

  if (params.kind === 'spread') {
    diagnostics.push(
      createDiagnostic({
        code: 'YPK106',
        fileId,
        hint: 'Pass keys explicitly to enable validation.',
        message: 'Spread params cannot be statically verified.',
        range: params.range,
        severity: 'warning',
        source: fileText,
      }),
    );
    return;
  }

  const providedKeys = new Set(params.keys);
  for (const key of placeholderKeys) {
    if (!providedKeys.has(key)) {
      diagnostics.push(
        createDiagnostic({
          code: 'YPK104',
          fileId,
          hint: `Add '${key}' to the params object.`,
          message: `Missing parameter '${key}' for placeholder '{${key}}'.`,
          range: params.range,
          severity: 'error',
          source: fileText,
        }),
      );
    }
  }
  const placeholderSet = new Set(placeholderKeys);
  for (const key of params.keys) {
    if (placeholderSet.has(key)) {
      continue;
    }
    diagnostics.push(
      createDiagnostic({
        code: 'YPK105',
        fileId,
        hint: `Remove '${key}' from the params object or add '{${key}}' to the source string.`,
        message: `Extra parameter '${key}' with no matching placeholder.`,
        range: params.range,
        severity: 'warning',
        source: fileText,
      }),
    );
  }
}
