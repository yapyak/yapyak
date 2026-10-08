import type { Argument, PropertyKey } from 'oxc-parser';
import type { Range } from '../../processor';
import type { TemplateDiagnostic } from '../placeholder';
import type { CallSite } from './call';
import type { Diagnostic } from './diagnostic';
import type { SourceFile } from './source-file';
import type { TagIssue } from './tag';

import { buildDiagnostic } from '../../diagnostic';
import { classifyNames } from '../name';
import { findMalformedIssue, parsePlaceholders } from '../placeholder';
import { toRange } from './range';
import { validateRichTextTags } from './tag';

export type ParsedParams = {
  entries: {
    key: string;
    valueRange: Range;
  }[];
  kind: 'dynamic' | 'spread' | 'static';
  range: Range;
};

export type ParsedArguments = {
  context?: string;
  diagnostics: Diagnostic[];
  params?: ParsedParams;
  source: string;
  sourceRange: Range;
};

export function parseArguments(
  callSite: CallSite,
  sourceFile: SourceFile,
): ParsedArguments {
  const fileId = sourceFile.fileId;
  const diagnostics: Diagnostic[] = [];
  const callRange = toRange(callSite.node, sourceFile);

  let context: string | undefined;

  if (callSite.contextExpression) {
    const contextExpression = callSite.contextExpression;
    context = getStaticString(contextExpression);
    if (context === undefined) {
      diagnostics.push(
        buildDiagnostic('CONTEXT_NOT_LITERAL', undefined, {
          fileId,
          range: toRange(contextExpression, sourceFile),
          severity: 'error',
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
          range: callRange,
          severity: 'error',
        },
      ),
    );
    const result: ParsedArguments = {
      diagnostics,
      source: '',
      sourceRange: callRange,
    };
    if (context !== undefined) {
      result.context = context;
    }
    return result;
  }

  const sourceRange = toRange(sourceExpression, sourceFile);
  const source = getStaticString(sourceExpression);
  if (source === undefined) {
    diagnostics.push(
      buildDiagnostic('PARSER_TEMPLATE_LITERAL', undefined, {
        fileId,
        range: sourceRange,
        severity: 'error',
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

  if (source === '') {
    diagnostics.push(
      buildDiagnostic('PARSER_EMPTY_SOURCE', undefined, {
        fileId,
        range: sourceRange,
        severity: 'error',
      }),
    );
  }

  const { issues, placeholders } = parsePlaceholders(source);
  const placeholderKeys = placeholders.map((placeholder) => placeholder.name);
  const hasPlaceholders = placeholderKeys.length > 0;
  const isSourceInvalid =
    findMalformedIssue(issues) !== undefined ||
    issues.some((issue) => issue.kind === 'invalid-name');

  for (const issue of issues) {
    diagnostics.push(
      toIcuDiagnostic(issue, {
        fileId,
        range: sourceRange,
      }),
    );
  }
  for (const issue of validateRichTextTags(source)) {
    diagnostics.push(
      toTagDiagnostic(issue, {
        fileId,
        range: sourceRange,
      }),
    );
  }

  const params =
    callSite.paramsExpression === undefined
      ? undefined
      : parseParams(callSite.paramsExpression, sourceFile);
  if (!isSourceInvalid && (hasPlaceholders || params !== undefined)) {
    validateParams({
      callRange,
      diagnostics,
      fileId,
      params,
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
  range: Range;
};

function getStaticString(argument: Argument): string | undefined {
  if (argument.type === 'Literal' && typeof argument.value === 'string') {
    return argument.value;
  }
  if (
    argument.type === 'TemplateLiteral' &&
    argument.expressions.length === 0
  ) {
    return argument.quasis[0]?.value.cooked ?? undefined;
  }
  return undefined;
}

function toIcuDiagnostic(
  issue: TemplateDiagnostic,
  context: IcuDiagnosticContext,
): Diagnostic {
  const diagnosticContext = {
    fileId: context.fileId,
    range: context.range,
    severity: 'error' as const,
  };
  if (issue.kind === 'unsupported-currency') {
    return buildDiagnostic(
      'PLACEHOLDER_CURRENCY_UNSUPPORTED',
      {
        currency: issue.currency,
      },
      {
        ...diagnosticContext,
        severity: 'warning',
      },
    );
  }
  if (issue.kind === 'missing-other') {
    return buildDiagnostic(
      'PLACEHOLDER_MISSING_OTHER',
      {
        name: issue.name,
      },
      diagnosticContext,
    );
  }
  if (issue.kind === 'malformed') {
    return buildDiagnostic(
      'PLACEHOLDER_MALFORMED',
      {
        detail: issue.message,
      },
      diagnosticContext,
    );
  }
  if (issue.kind === 'invalid-name') {
    return buildDiagnostic(
      'PLACEHOLDER_NAME_INVALID',
      {
        name: issue.name,
      },
      diagnosticContext,
    );
  }
  if (issue.kind === 'unknown-keyword') {
    return buildDiagnostic(
      'PLACEHOLDER_KEYWORD_UNKNOWN',
      {
        branch: issue.branch,
        kind: issue.pluralKind === 'ordinal' ? 'selectordinal' : 'plural',
        name: issue.name,
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

function toTagDiagnostic(
  issue: TagIssue,
  context: IcuDiagnosticContext,
): Diagnostic {
  const diagnosticContext = {
    fileId: context.fileId,
    range: context.range,
    severity: 'error' as const,
  };
  if (issue.kind === 'unclosed-open') {
    return buildDiagnostic(
      'RICHTEXT_TAG_UNCLOSED',
      {
        name: issue.name,
      },
      diagnosticContext,
    );
  }
  if (issue.kind === 'unopened-close') {
    return buildDiagnostic(
      'RICHTEXT_TAG_UNOPENED',
      {
        name: issue.name,
      },
      diagnosticContext,
    );
  }
  if (issue.kind === 'name-missing') {
    return buildDiagnostic(
      'RICHTEXT_TAG_NAME_MISSING',
      undefined,
      diagnosticContext,
    );
  }
  return buildDiagnostic(
    'RICHTEXT_TAG_MISMATCHED',
    {
      actual: issue.actual,
      expected: issue.expected,
    },
    diagnosticContext,
  );
}

function parseParams(argument: Argument, sourceFile: SourceFile): ParsedParams {
  const range = toRange(argument, sourceFile);
  if (argument.type !== 'ObjectExpression') {
    return {
      entries: [],
      kind: 'dynamic',
      range,
    };
  }
  const entries: ParsedParams['entries'] = [];
  let kind: ParsedParams['kind'] = 'static';
  for (const property of argument.properties) {
    if (property.type === 'SpreadElement') {
      kind = 'spread';
      continue;
    }
    const key =
      property.kind === 'init' && !property.method && !property.computed
        ? getPropertyKeyName(property.key)
        : undefined;
    if (key === undefined) {
      kind = 'spread';
      continue;
    }
    entries.push({
      key,
      valueRange: toRange(property.value, sourceFile),
    });
  }
  return {
    entries,
    kind,
    range,
  };
}

function getPropertyKeyName(key: PropertyKey): string | undefined {
  if (key.type === 'Identifier') {
    return key.name;
  }
  if (key.type === 'Literal' && typeof key.value === 'string') {
    return key.value;
  }
  return undefined;
}

type ValidateParamsInput = {
  callRange: Range;
  diagnostics: Diagnostic[];
  fileId: string;
  params: ParsedParams | undefined;
  placeholderKeys: string[];
};

function validateParams(input: ValidateParamsInput): void {
  const { callRange, diagnostics, fileId, params, placeholderKeys } = input;

  if (params === undefined) {
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
          },
        ),
      );
    }
    return;
  }

  if (params.kind === 'dynamic') {
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
        },
      ),
    );
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
        },
      ),
    );
    return;
  }

  const { extra, missing, renames } = classifyNames(
    placeholderKeys,
    params.entries.map((entry) => entry.key),
  );
  for (const rename of renames) {
    diagnostics.push(
      buildDiagnostic(
        'PARSER_PARAM_MISSPELLED',
        {
          key: rename.from,
          placeholder: rename.to,
        },
        {
          fileId,
          range: params.range,
          severity: 'error',
        },
      ),
    );
  }
  for (const key of missing) {
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
        },
      ),
    );
  }
  for (const key of extra) {
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
        },
      ),
    );
  }
}
