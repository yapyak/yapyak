import type { Range } from '../../processor';
import type { CallSite } from './call';
import type { Diagnostic } from './diagnostic';
import type { TemplateDiagnostic } from './placeholder';

import ts from 'typescript';

import { buildDiagnostic } from '../../diagnostic';
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
      diagnostics.push(
        buildDiagnostic('CONTEXT_NOT_LITERAL', undefined, {
          fileId,
          range: toRange(contextExpression, sourceFile),
          severity: 'error',
          source: fileText,
        }),
      );
    }
  }

  const sourceExpression = callSite.sourceExpression;
  if (!sourceExpression) {
    diagnostics.push(
      buildDiagnostic(
        'PARSER_NO_SOURCE',
        {
          method: callSite.contextExpression ? 't.as' : 't',
        },
        {
          fileId,
          range: toRange(callSite.node, sourceFile),
          severity: 'error',
          source: fileText,
        },
      ),
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

  const sourceRange = toRange(sourceExpression, sourceFile);
  if (!isLiteralFirstArg(sourceExpression)) {
    diagnostics.push(
      buildDiagnostic('PARSER_TEMPLATE_LITERAL', undefined, {
        fileId,
        range: sourceRange,
        severity: 'error',
        source: fileText,
      }),
    );
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
    diagnostics.push(
      buildDiagnostic('PARSER_EMPTY_SOURCE', undefined, {
        fileId,
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
  const diagnosticContext = {
    fileId: context.fileId,
    range: context.range,
    severity: 'error' as const,
    source: context.fileText,
  };
  if (issue.reason === 'missing-other') {
    return buildDiagnostic(
      'PLACEHOLDER_MISSING_OTHER',
      {
        name: issue.name,
      },
      diagnosticContext,
    );
  }
  if (issue.reason === 'malformed') {
    return buildDiagnostic(
      'PLACEHOLDER_MALFORMED',
      {
        detail: issue.message,
      },
      diagnosticContext,
    );
  }
  return buildDiagnostic(
    'PLACEHOLDER_UNSUPPORTED',
    {
      feature: issue.feature,
      name: issue.name,
    },
    diagnosticContext,
  );
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
      diagnostics.push(
        buildDiagnostic(
          'PARSER_DYNAMIC_PARAMS',
          {
            kind: 'dynamic',
          },
          {
            fileId,
            range: callRange,
            severity: 'warning',
            source: fileText,
          },
        ),
      );
      return;
    }
    for (const key of placeholderKeys) {
      diagnostics.push(
        buildDiagnostic(
          'PARSER_MISSING_PARAM',
          {
            key,
            mode: 'add-object',
          },
          {
            fileId,
            range: callRange,
            severity: 'error',
            source: fileText,
          },
        ),
      );
    }
    return;
  }

  if (params.kind === 'spread') {
    diagnostics.push(
      buildDiagnostic(
        'PARSER_DYNAMIC_PARAMS',
        {
          kind: 'spread',
        },
        {
          fileId,
          range: params.range,
          severity: 'warning',
          source: fileText,
        },
      ),
    );
    return;
  }

  const providedKeys = new Set(params.keys);
  for (const key of placeholderKeys) {
    if (!providedKeys.has(key)) {
      diagnostics.push(
        buildDiagnostic(
          'PARSER_MISSING_PARAM',
          {
            key,
            mode: 'add-key',
          },
          {
            fileId,
            range: params.range,
            severity: 'error',
            source: fileText,
          },
        ),
      );
    }
  }
  const placeholderSet = new Set(placeholderKeys);
  for (const key of params.keys) {
    if (placeholderSet.has(key)) {
      continue;
    }
    diagnostics.push(
      buildDiagnostic(
        'PARSER_EXTRA_PARAM',
        {
          key,
        },
        {
          fileId,
          range: params.range,
          severity: 'warning',
          source: fileText,
        },
      ),
    );
  }
}
