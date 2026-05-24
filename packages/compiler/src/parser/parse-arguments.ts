import type {
  CallSite,
  Diagnostic,
  DiagnosticCode,
  ParsedArguments,
  ParsedParams,
  Range,
  StaticOptions,
} from './type';

import * as ts from 'typescript';

import { parsePlaceholders } from './plural';
import { toRange } from './position';

export function parseArguments(callSite: CallSite): ParsedArguments {
  const sourceFile = callSite.node.getSourceFile();
  const fileText = sourceFile.text;
  const fileId = sourceFile.fileName;
  const callArgs = callSite.node.arguments;
  const firstArg = callArgs[0];
  const diagnostics: Diagnostic[] = [];

  if (firstArg === undefined) {
    diagnostics.push(
      diagnostic(
        'YPK001',
        'error',
        '$t() called without arguments',
        fileId,
        toRange(callSite.node, sourceFile),
        fileText,
      ),
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
      diagnostic(
        'YPK001',
        'error',
        'Dynamic source string in $t(). Use a plain string literal with `{placeholder}` syntax.',
        fileId,
        sourceRange,
        fileText,
        "Replace `$t(`Hi ${name}`)` with `$t('Hi {name}', { name })`.",
      ),
    );
    return { diagnostics, source: '', sourceRange };
  }

  const source = firstArg.text;
  if (source === '') {
    diagnostics.push(
      diagnostic(
        'YPK008',
        'error',
        '$t() called with empty source string.',
        fileId,
        sourceRange,
        fileText,
      ),
    );
  }

  const placeholderInfos = parsePlaceholders(source);
  const placeholderKeys = placeholderInfos.map((info) => info.name);
  const hasPlaceholders = placeholderKeys.length > 0;

  for (const info of placeholderInfos) {
    if (info.invalid === 'plural-missing-other') {
      diagnostics.push(
        diagnostic(
          'YPK007',
          'error',
          `Plural placeholder '{${info.name}}' is missing the required 'other' branch.`,
          fileId,
          sourceRange,
          fileText,
          'Add `other {<text>}` to the plural — every plural must have an `other` fallback.',
        ),
      );
    }
  }

  let params: ParsedParams | undefined;
  let options: StaticOptions | undefined;

  if (hasPlaceholders) {
    const paramArg = callArgs[1];
    params =
      paramArg === undefined ? undefined : parseParams(paramArg, sourceFile);
    const optionsArg = callArgs[2];
    if (optionsArg !== undefined) {
      options = extractStaticOptions(optionsArg);
    }
    validateParams({
      callSite,
      diagnostics,
      fileId,
      fileText,
      params,
      placeholderKeys,
      sourceRange,
    });
  } else {
    const optionsArg = callArgs[1];
    if (optionsArg !== undefined) {
      options = extractStaticOptions(optionsArg);
    }
  }

  const result: ParsedArguments = { diagnostics, source, sourceRange };
  if (params !== undefined) result.params = params;
  if (options !== undefined) result.options = options;
  return result;
}

function isLiteralFirstArg(
  arg: ts.Expression,
): arg is ts.StringLiteral | ts.NoSubstitutionTemplateLiteral {
  return ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg);
}

function parseParams(
  arg: ts.Expression,
  sourceFile: ts.SourceFile,
): ParsedParams | undefined {
  if (!ts.isObjectLiteralExpression(arg)) return undefined;
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

interface ValidateParamsInput {
  callSite: CallSite;
  diagnostics: Diagnostic[];
  fileId: string;
  fileText: string;
  params: ParsedParams | undefined;
  placeholderKeys: string[];
  sourceRange: Range;
}

function validateParams(input: ValidateParamsInput): void {
  const {
    callSite,
    diagnostics,
    fileId,
    fileText,
    params,
    placeholderKeys,
    sourceRange,
  } = input;
  const sourceFile = callSite.node.getSourceFile();
  const callRange = toRange(callSite.node, sourceFile);

  if (params === undefined) {
    for (const key of placeholderKeys) {
      diagnostics.push(
        diagnostic(
          'YPK002',
          'error',
          `Missing parameter '${key}' for placeholder '{${key}}'.`,
          fileId,
          callRange,
          fileText,
          `Add { ${key}: ... } as the second argument.`,
        ),
      );
    }
    return;
  }

  if (params.kind === 'spread') {
    diagnostics.push(
      diagnostic(
        'YPK005',
        'warning',
        'Spread params cannot be statically verified.',
        fileId,
        params.range,
        fileText,
        'Pass keys explicitly to enable validation.',
      ),
    );
    return;
  }

  const providedKeys = new Set(params.keys);
  for (const key of placeholderKeys) {
    if (!providedKeys.has(key)) {
      diagnostics.push(
        diagnostic(
          'YPK002',
          'error',
          `Missing parameter '${key}' for placeholder '{${key}}'.`,
          fileId,
          params.range,
          fileText,
          `Add '${key}' to the params object.`,
        ),
      );
    }
  }
  const placeholderSet = new Set(placeholderKeys);
  for (const key of params.keys) {
    if (!placeholderSet.has(key)) {
      diagnostics.push(
        diagnostic(
          'YPK003',
          'warning',
          `Extra parameter '${key}' with no matching placeholder.`,
          fileId,
          params.range,
          fileText,
          `Remove '${key}' from the params object or add '{${key}}' to the source string.`,
        ),
      );
    }
  }
  void sourceRange;
}

function diagnostic(
  code: DiagnosticCode,
  severity: 'error' | 'warning',
  message: string,
  fileId: string,
  range: Range,
  source: string,
  hint?: string,
): Diagnostic {
  const result: Diagnostic = {
    code,
    fileId,
    message,
    range,
    severity,
    source,
  };
  if (hint !== undefined) result.hint = hint;
  return result;
}
