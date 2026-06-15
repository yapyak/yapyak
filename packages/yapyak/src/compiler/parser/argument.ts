import type { Range } from '../../processor';
import type { CallSite } from './call';
import type { Diagnostic } from './diagnostic';
import type { TemplateDiagnostic } from './placeholder';

import ts from 'typescript';

import { YAP } from '../../diagnostics/codes';
import { parsePlaceholders } from './placeholder';
import { toRange } from './range';

type ParsedParams = {
  keys: string[];
  kind: 'spread' | 'static';
  range: Range;
};

export type ParsedArguments = {
  context?: string;
  diagnostics: Diagnostic[];
  params?: ParsedParams;
  source: string;
  sourceRange: Range;
};

export function parseArguments(callSite: CallSite): ParsedArguments {
  const sourceFile = callSite.node.getSourceFile();
  const fileText = sourceFile.text;
  const fileId = sourceFile.fileName;
  const diagnostics: Diagnostic[] = [];

  let context: string | undefined;

  if (callSite.contextExpression) {
    const contextExpression = callSite.contextExpression;
    if (
      ts.isStringLiteral(contextExpression) ||
      ts.isNoSubstitutionTemplateLiteral(contextExpression)
    ) {
      context = contextExpression.text;
    } else {
      diagnostics.push({
        code: YAP.CONTEXT_NOT_LITERAL,
        fileId,
        hint: 'Pass a static string literal as the context argument.',
        message: '`t.as()` context argument is not a static string literal.',
        range: toRange(contextExpression, sourceFile),
        severity: 'error',
        source: fileText,
      });
    }
  }

  const sourceExpression = callSite.sourceExpression;
  if (!sourceExpression) {
    diagnostics.push({
      code: YAP.PARSER_NO_SOURCE,
      fileId,
      hint: 'Pass the English source as the first (or, for `t.as()`, second) argument.',
      message: callSite.contextExpression
        ? '`t.as()` called without a source string.'
        : '`t()` called without arguments.',
      range: toRange(callSite.node, sourceFile),
      severity: 'error',
      source: fileText,
    });
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

  const sourceRange = toRange(sourceExpression, sourceFile);
  if (!isLiteralFirstArg(sourceExpression)) {
    diagnostics.push({
      code: YAP.PARSER_TEMPLATE_LITERAL,
      fileId,
      // biome-ignore lint/suspicious/noTemplateCurlyInString: yap yap yap
      hint: "Replace `t(`Hi ${name}`)` with `t('Hi {name}', { name })`.",
      message: 'Source argument is a dynamic template literal.',
      range: sourceRange,
      severity: 'error',
      source: fileText,
    });
    const result: ParsedArguments = {
      diagnostics,
      source: '',
      sourceRange,
    };
    if (context !== undefined) {
      result.context = context;
    }
    return result;
  }

  const source = sourceExpression.text;
  if (source === '') {
    diagnostics.push({
      code: YAP.PARSER_EMPTY_SOURCE,
      fileId,
      hint: 'Provide a non-empty English source as the first argument.',
      message: '`t()` called with an empty source string.',
      range: sourceRange,
      severity: 'error',
      source: fileText,
    });
  }

  const { issues, placeholders } = parsePlaceholders(source);
  const placeholderKeys = placeholders.map((placeholder) => placeholder.name);
  const hasPlaceholders = placeholderKeys.length > 0;

  for (const issue of issues) {
    diagnostics.push(
      toIcuDiagnostic(issue, {
        fileId,
        fileText,
        range: sourceRange,
      }),
    );
  }

  let params: ParsedParams | undefined;
  const paramsExpression = callSite.paramsExpression;
  if (paramsExpression) {
    params = parseParams(paramsExpression, sourceFile);
  }
  if (hasPlaceholders || paramsExpression) {
    validateParams({
      callSite,
      diagnostics,
      fileId,
      fileText,
      params,
      paramsExpressionPresent: paramsExpression !== undefined,
      placeholderKeys,
    });
  }

  const result: ParsedArguments = {
    diagnostics,
    source,
    sourceRange,
  };
  if (context !== undefined) {
    result.context = context;
  }
  if (params) {
    result.params = params;
  }
  return result;
}

type IcuDiagnosticContext = {
  fileId: string;
  fileText: string;
  range: Range;
};

function toIcuDiagnostic(
  issue: TemplateDiagnostic,
  context: IcuDiagnosticContext,
): Diagnostic {
  if (issue.reason === 'missing-other') {
    return {
      code: YAP.PLACEHOLDER_MISSING_OTHER,
      fileId: context.fileId,
      hint: 'Add an `other {<text>}` branch. `plural`, `selectordinal`, and `select` all require an `other` fallback.',
      message: `Placeholder \`{${issue.name}}\` is missing the required \`other\` branch.`,
      range: context.range,
      severity: 'error',
      source: context.fileText,
    };
  }
  if (issue.reason === 'malformed') {
    return {
      code: YAP.PLACEHOLDER_MALFORMED,
      fileId: context.fileId,
      hint: 'Check the ICU syntax. Every `{` needs a matching `}`.',
      message: issue.message,
      range: context.range,
      severity: 'error',
      source: context.fileText,
    };
  }
  return {
    code: YAP.PLACEHOLDER_UNSUPPORTED,
    fileId: context.fileId,
    hint: 'Use a supported ICU feature, or format the value before passing it in.',
    message: issue.name
      ? `Unsupported ICU feature in \`{${issue.name}}\`: ${issue.feature}.`
      : `Unsupported ICU feature: ${issue.feature}.`,
    range: context.range,
    severity: 'error',
    source: context.fileText,
  };
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
  return {
    keys,
    kind,
    range: toRange(expression, sourceFile),
  };
}

type ValidateParamsInput = {
  callSite: CallSite;
  diagnostics: Diagnostic[];
  fileId: string;
  fileText: string;
  params: ParsedParams | undefined;
  paramsExpressionPresent: boolean;
  placeholderKeys: string[];
};

function validateParams(input: ValidateParamsInput): void {
  const {
    callSite,
    diagnostics,
    fileId,
    fileText,
    paramsExpressionPresent: hasParamsExpression,
    params,
    placeholderKeys,
  } = input;
  const sourceFile = callSite.node.getSourceFile();
  const callRange = toRange(callSite.node, sourceFile);

  if (!params) {
    if (hasParamsExpression) {
      diagnostics.push({
        code: YAP.PARSER_DYNAMIC_PARAMS,
        fileId,
        hint: 'Pass params as an inline object literal to enable validation.',
        message:
          'Params are passed dynamically and cannot be statically verified.',
        range: callRange,
        severity: 'warning',
        source: fileText,
      });
      return;
    }
    for (const key of placeholderKeys) {
      diagnostics.push({
        code: YAP.PARSER_MISSING_PARAM,
        fileId,
        hint: `Add \`{ ${key}: ... }\` as the second argument.`,
        message: `Params is missing key \`${key}\` for placeholder \`{${key}}\`.`,
        range: callRange,
        severity: 'error',
        source: fileText,
      });
    }
    return;
  }

  if (params.kind === 'spread') {
    diagnostics.push({
      code: YAP.PARSER_DYNAMIC_PARAMS,
      fileId,
      hint: 'Pass keys explicitly to enable validation.',
      message: 'Spread params cannot be statically verified.',
      range: params.range,
      severity: 'warning',
      source: fileText,
    });
    return;
  }

  const providedKeys = new Set(params.keys);
  for (const key of placeholderKeys) {
    if (!providedKeys.has(key)) {
      diagnostics.push({
        code: YAP.PARSER_MISSING_PARAM,
        fileId,
        hint: `Add \`${key}\` to the params object.`,
        message: `Params is missing key \`${key}\` for placeholder \`{${key}}\`.`,
        range: params.range,
        severity: 'error',
        source: fileText,
      });
    }
  }
  const placeholderSet = new Set(placeholderKeys);
  for (const key of params.keys) {
    if (placeholderSet.has(key)) {
      continue;
    }
    diagnostics.push({
      code: YAP.PARSER_EXTRA_PARAM,
      fileId,
      hint: `Remove \`${key}\` from the params object or add \`{${key}}\` to the source string.`,
      message: `Params has extra key \`${key}\` with no matching placeholder.`,
      range: params.range,
      severity: 'warning',
      source: fileText,
    });
  }
}
