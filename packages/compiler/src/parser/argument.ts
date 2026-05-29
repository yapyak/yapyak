import type { CallSite } from './call';
import type { Diagnostic } from './diagnostic';
import type { IcuIssue } from './placeholder';
import type { Range } from './range';

import * as ts from 'typescript';

import { createDiagnostic } from './diagnostic';
import { parsePlaceholders } from './placeholder';
import { toRange } from './range';

export interface ParsedParams {
  keys: string[];
  kind: 'spread' | 'static';
  range: Range;
}

export interface ParsedArguments {
  diagnostics: Diagnostic[];
  optionsExpression?: string;
  params?: ParsedParams;
  source: string;
  sourceRange: Range;
}

export function parseArguments(callSite: CallSite): ParsedArguments {
  const sourceFile = callSite.node.getSourceFile();
  const fileText = sourceFile.text;
  const fileId = sourceFile.fileName;
  const callArgs = callSite.node.arguments;
  const firstArg = callArgs[0];
  const diagnostics: Diagnostic[] = [];

  if (!firstArg) {
    diagnostics.push(
      createDiagnostic({
        code: 'YPK001',
        fileId,
        message: 't() called without arguments.',
        range: toRange(callSite.node, sourceFile),
        severity: 'error',
        source: fileText,
      }),
    );
    return {
      diagnostics,
      source: '',
      sourceRange: toRange(callSite.node, sourceFile),
    };
  }

  const sourceRange = toRange(firstArg, sourceFile);
  if (!isLiteralFirstArg(firstArg)) {
    diagnostics.push(
      createDiagnostic({
        code: 'YPK001',
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
    return { diagnostics, source: '', sourceRange };
  }

  const source = firstArg.text;
  if (source === '') {
    diagnostics.push(
      createDiagnostic({
        code: 'YPK008',
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
  let optionsExpression: string | undefined;

  if (hasPlaceholders) {
    const paramArg = callArgs[1];
    params = paramArg ? parseParams(paramArg, sourceFile) : undefined;
    const optionsArg = callArgs[2];
    if (optionsArg) {
      optionsExpression = optionsArg.getText();
    }
    validateParams({
      callSite,
      diagnostics,
      fileId,
      fileText,
      hasParamArg: Boolean(paramArg),
      params,
      placeholderKeys,
    });
  } else {
    const optionsArg = callArgs[2] ?? callArgs[1];
    if (optionsArg) {
      optionsExpression = optionsArg.getText();
    }
  }

  const result: ParsedArguments = { diagnostics, source, sourceRange };
  if (params) {
    result.params = params;
  }
  if (optionsExpression) result.optionsExpression = optionsExpression;
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
      code: 'YPK007',
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
      code: 'YPK009',
      fileId: context.fileId,
      hint: 'Check the ICU syntax — every `{` needs a matching `}`.',
      message: `Malformed ICU message (${issue.message}).`,
      range: context.range,
      severity: 'error',
      source: context.fileText,
    });
  }
  return createDiagnostic({
    code: 'YPK010',
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
  arg: ts.Expression,
): arg is ts.NoSubstitutionTemplateLiteral | ts.StringLiteral {
  return ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg);
}

function parseParams(
  arg: ts.Expression,
  sourceFile: ts.SourceFile,
): ParsedParams | undefined {
  if (!ts.isObjectLiteralExpression(arg)) {
    return undefined;
  }
  const keys: string[] = [];
  let kind: 'spread' | 'static' = 'static';
  for (const prop of arg.properties) {
    if (ts.isSpreadAssignment(prop)) {
      kind = 'spread';
      continue;
    }
    if (
      ts.isShorthandPropertyAssignment(prop) ||
      ts.isPropertyAssignment(prop)
    ) {
      if (ts.isIdentifier(prop.name)) {
        keys.push(prop.name.text);
        continue;
      }
      if (ts.isStringLiteral(prop.name)) {
        keys.push(prop.name.text);
      }
    }
  }
  return { keys, kind, range: toRange(arg, sourceFile) };
}

interface ValidateParamsInput {
  callSite: CallSite;
  diagnostics: Diagnostic[];
  fileId: string;
  fileText: string;
  hasParamArg: boolean;
  params: ParsedParams | undefined;
  placeholderKeys: string[];
}

function validateParams(input: ValidateParamsInput): void {
  const {
    callSite,
    diagnostics,
    fileId,
    fileText,
    hasParamArg,
    params,
    placeholderKeys,
  } = input;
  const sourceFile = callSite.node.getSourceFile();
  const callRange = toRange(callSite.node, sourceFile);

  if (!params) {
    if (hasParamArg) {
      diagnostics.push(
        createDiagnostic({
          code: 'YPK005',
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
          code: 'YPK002',
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
        code: 'YPK005',
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
          code: 'YPK002',
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
        code: 'YPK003',
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
