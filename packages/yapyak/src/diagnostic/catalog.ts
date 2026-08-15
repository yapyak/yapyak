import type { Range } from '../processor';

import { warn } from '../warn';

const DOCS_BASE = 'https://yapyak.dev/reference/diagnostics';

// biome-ignore assist/source/useSortedKeys: yap yap yap
export const YAP_COMPILE = {
  PARSER_NO_SOURCE: {
    code: 'YAP0001',
    hint: (): string =>
      'Pass the English source as the first (or, for `t.as()`, second) argument.',
    message: ({ method }: { method: 't' | 't.as' }): string =>
      method === 't.as'
        ? '`t.as()` called without a source string.'
        : '`t()` called without arguments.',
  },
  PARSER_TEMPLATE_LITERAL: {
    code: 'YAP0002',
    hint: (): string =>
      // biome-ignore lint/suspicious/noTemplateCurlyInString: yap yap yap
      "Replace `t(`Hi ${name}`)` with `t('Hi {name}', { name })`.",
    message: (): string => 'Source argument is a dynamic template literal.',
  },
  PARSER_EMPTY_SOURCE: {
    code: 'YAP0003',
    hint: (): string =>
      'Provide a non-empty English source as the first argument.',
    message: (): string => '`t()` called with an empty source string.',
  },
  PARSER_MISSING_PARAM: {
    code: 'YAP0004',
    hint: ({
      key,
      mode,
    }: {
      key: string;
      mode: 'add-key' | 'add-object';
    }): string =>
      mode === 'add-object'
        ? `Add \`{ ${key}: ... }\` as the second argument.`
        : `Add \`${key}\` to the params object.`,
    message: ({
      key,
    }: {
      key: string;
      mode: 'add-key' | 'add-object';
    }): string =>
      `Params is missing key \`${key}\` for placeholder \`{${key}}\`.`,
  },
  PARSER_EXTRA_PARAM: {
    code: 'YAP0005',
    hint: ({ key }: { key: string }): string =>
      `Remove \`${key}\` from the params object or add \`{${key}}\` to the source string.`,
    message: ({ key }: { key: string }): string =>
      `Params has extra key \`${key}\` with no matching placeholder.`,
  },
  PARSER_DYNAMIC_PARAMS: {
    code: 'YAP0006',
    hint: ({ kind }: { kind: 'dynamic' | 'spread' }): string =>
      kind === 'spread'
        ? 'Pass keys explicitly to enable validation.'
        : 'Pass params as an inline object literal to enable validation.',
    message: ({ kind }: { kind: 'dynamic' | 'spread' }): string =>
      kind === 'spread'
        ? 'Spread params cannot be statically verified.'
        : 'Params are passed dynamically and cannot be statically verified.',
  },
  PLACEHOLDER_MALFORMED: {
    code: 'YAP0007',
    hint: (): string => 'Check the ICU syntax. Every `{` needs a matching `}`.',
    message: ({ detail }: { detail: string }): string => detail,
  },
  PLACEHOLDER_MISSING_OTHER: {
    code: 'YAP0008',
    hint: (): string =>
      'Add an `other {<text>}` branch. `plural`, `selectordinal`, and `select` all require an `other` fallback.',
    message: ({ name }: { name: string }): string =>
      `Placeholder \`{${name}}\` is missing the required \`other\` branch.`,
  },
  PLACEHOLDER_UNSUPPORTED: {
    code: 'YAP0009',
    hint: (): string =>
      'Use a supported ICU feature, or format the value before passing it in.',
    message: ({ feature, name }: { feature: string; name?: string }): string =>
      name
        ? `Unsupported ICU feature in \`{${name}}\`: ${feature}.`
        : `Unsupported ICU feature: ${feature}.`,
  },
  PLACEHOLDER_KIND_MISMATCH: {
    code: 'YAP0010',
    hint: ({ sourceKind }: { name: string; sourceKind: string }): string =>
      `Match the placeholder kind \`${sourceKind}\` from the source.`,
    message: ({
      name,
      sourceKind,
      targetKind,
    }: {
      name: string;
      sourceKind: string;
      targetKind: string;
    }): string =>
      `Placeholder \`{${name}}\` is \`${sourceKind}\` in the source but \`${targetKind}\` in the translation.`,
  },
  PLACEHOLDER_MISSING_IN_TARGET: {
    code: 'YAP0011',
    hint: ({ name }: { name: string }): string =>
      `Include \`{${name}}\` in the translation.`,
    message: ({ name }: { name: string }): string =>
      `Placeholder \`{${name}}\` is in the source but missing from the translation.`,
  },
  PLACEHOLDER_MISSING_IN_SOURCE: {
    code: 'YAP0012',
    hint: ({ name }: { name: string }): string =>
      `Remove \`{${name}}\` from the translation or add it to the source.`,
    message: ({ name }: { name: string }): string =>
      `Placeholder \`{${name}}\` is in the translation but missing from the source.`,
  },
  CATALOG_INVALID_SHAPE: {
    code: 'YAP0013',
    hint: (): string =>
      'Locale-file entries must be an object keyed by source string with each value being a translation or a context-keyed object.',
    message: ({ detail }: { detail: string }): string => detail,
  },
  CATALOG_UNSAFE_PATH: {
    code: 'YAP0014',
    message: ({ pathKey }: { pathKey: string }): string =>
      `Unsafe file-path key "${pathKey}". Paths must be relative, use forward slashes, and contain no ".." segments.`,
  },
  CATALOG_NOT_NFC: {
    code: 'YAP0015',
    hint: (): string => 'Normalize the string to Unicode NFC.',
    message: ({ detail }: { detail: string }): string => detail,
  },
  CATALOG_INVALID_JSON: {
    code: 'YAP0016',
    message: ({ detail }: { detail: string }): string =>
      `Locale file is not valid JSON. ${detail}.`,
  },
  CONTEXT_NOT_LITERAL: {
    code: 'YAP0017',
    hint: (): string => 'Pass a static string literal as the context argument.',
    message: (): string =>
      '`t.as()` context argument is not a static string literal.',
  },
  CONTEXT_MIXED_USAGE: {
    code: 'YAP0018',
    hint: (): string =>
      'Either use `t.as(context, ...)` for every occurrence, or remove `t.as` from all of them.',
    message: ({ fileId, source }: { fileId: string; source: string }): string =>
      `Source "${source}" is used with both \`t()\` and \`t.as()\` in ${fileId}.`,
  },
  CONTEXT_UNUSED: {
    code: 'YAP0019',
    hint: ({ context, source }: { context: string; source: string }): string =>
      `Drop \`.as("${context}", ...)\`. Without another context for "${source}", it has no effect.`,
    message: ({
      context,
      fileId,
      source,
    }: {
      context: string;
      fileId: string;
      source: string;
    }): string =>
      `\`t.as("${context}", "${source}")\` in ${fileId} has no other context to disambiguate from.`,
  },
  CONTEXT_DYNAMIC_CALL: {
    code: 'YAP0020',
    hint: ({ methodName }: { methodName: 'as' | 'in' }): string =>
      methodName === 'in'
        ? "Pass the source inline: `t.in('sv', 'source')` or chain with `.as()`: `t.in('sv').as('context', 'source')`."
        : "Pass the source inline: `t.as('context', 'source')` or chain with `.in()`: `t.as('context').in('sv', 'source')`.",
    message: ({ methodName }: { methodName: 'as' | 'in' }): string =>
      `\`t.${methodName}()\` captured into a variable. Modifiers must be used inline.`,
  },
  PLACEHOLDER_BRANCH_MISSING_IN_TARGET: {
    code: 'YAP0038',
    hint: ({ branch, name }: { branch: string; name: string }): string =>
      `Add the \`${branch}\` branch to \`{${name}}\` in the translation.`,
    message: ({ branch, name }: { branch: string; name: string }): string =>
      `Placeholder \`{${name}}\` branch \`${branch}\` is in the source but missing from the translation.`,
  },
  RICHTEXT_TAG_UNCLOSED: {
    code: 'YAP0041',
    hint: ({ name }: { name: string }): string =>
      `Close the tag with \`</${name}>\` or rewrite as a void tag \`<${name}/>\`.`,
    message: ({ name }: { name: string }): string =>
      `Opening tag \`<${name}>\` has no closing tag.`,
  },
  RICHTEXT_TAG_MISMATCHED: {
    code: 'YAP0042',
    hint: ({ expected }: { expected: string }): string =>
      `Close the opening tag first with \`</${expected}>\`.`,
    message: ({
      actual,
      expected,
    }: {
      actual: string;
      expected: string;
    }): string =>
      `Closing tag \`</${actual}>\` does not match opening \`<${expected}>\`.`,
  },
  RICHTEXT_TAG_UNOPENED: {
    code: 'YAP0043',
    hint: ({ name }: { name: string }): string =>
      `Add an opening \`<${name}>\` or remove the closing tag.`,
    message: ({ name }: { name: string }): string =>
      `Closing tag \`</${name}>\` has no matching opening tag.`,
  },
  RICHTEXT_TAG_NAME_MISSING: {
    code: 'YAP0044',
    hint: (): string => 'Provide a name like `<link>` or remove the brackets.',
    message: (): string => 'Tag has no name.',
  },
  PLACEHOLDER_BRANCH_UNKNOWN: {
    code: 'YAP0045',
    hint: ({
      categories,
    }: {
      branch: string;
      categories: string[];
      kind: 'ordinal' | 'plural';
      locale: string;
      name: string;
    }): string =>
      `Use one of ${categories
        .map((category) => `\`${category}\``)
        .join(', ')}, or an exact match like \`=1\`.`,
    message: ({
      branch,
      kind,
      locale,
      name,
    }: {
      branch: string;
      categories: string[];
      kind: 'ordinal' | 'plural';
      locale: string;
      name: string;
    }): string =>
      `Branch "${branch}" in \`{${name}}\` is not ${kind === 'ordinal' ? 'an' : 'a'} ${kind} category of locale "${locale}".`,
  },
  PLACEHOLDER_KEYWORD_UNKNOWN: {
    code: 'YAP0046',
    hint: (): string =>
      'Use one of `zero`, `one`, `two`, `few`, `many`, `other`, or an exact match like `=1`.',
    message: ({
      branch,
      kind,
      name,
    }: {
      branch: string;
      kind: 'plural' | 'selectordinal';
      name: string;
    }): string =>
      `Branch "${branch}" in \`{${name}}\` is not a ${kind} keyword.`,
  },
  PROCESSOR_PARSE_ERROR: {
    code: 'YAP0048',
    hint: (): string => 'Fix the reported syntax so the file can be processed.',
    message: ({ text }: { text: string }): string =>
      `The file does not parse: "${text}".`,
  },
  PARSER_PARAM_MISSPELLED: {
    code: 'YAP0049',
    hint: ({
      key,
      placeholder,
    }: {
      key: string;
      placeholder: string;
    }): string => `Rename \`${key}\` to \`${placeholder}\`.`,
    message: ({
      key,
      placeholder,
    }: {
      key: string;
      placeholder: string;
    }): string =>
      `Params key \`${key}\` does not match placeholder \`{${placeholder}}\`.`,
  },
  PLACEHOLDER_MALFORMED_IN_TARGET: {
    code: 'YAP0050',
    hint: (): string =>
      'Fix the ICU syntax in the locale file. Every `{` needs a matching `}`.',
    message: ({ detail }: { detail: string }): string =>
      `The translation does not parse: ${detail}.`,
  },
  PLACEHOLDER_MISSPELLED_IN_TARGET: {
    code: 'YAP0051',
    hint: ({ source, target }: { source: string; target: string }): string =>
      `Rename \`{${target}}\` to \`{${source}}\` in the translation.`,
    message: ({ source, target }: { source: string; target: string }): string =>
      `Placeholder \`{${target}}\` in the translation does not match \`{${source}}\` in the source.`,
  },
} as const;

// biome-ignore assist/source/useSortedKeys: yap yap yap
export const YAP_RUNTIME = {
  RUNTIME_NOT_INITIALIZED: {
    code: 'YAP0021',
    message: (): string =>
      'Yapyak runtime is not initialized. Register the build-tool plugin (`@yapyak/vite`) in your bundler config.',
  },
  RUNTIME_SSR_LEAK_RISK: {
    code: 'YAP0022',
    message: (): string =>
      'getLocale() fell back to the shared module-global locale on the server. Register the host-integration middleware so each request binds its own locale.',
  },
  PERSISTENCE_COOKIE_WRITER_MISSING: {
    code: 'YAP0023',
    message: (): string =>
      'setLocale() called server-side outside a `withResponse` scope. The cookie was not set. Install the matching adapter middleware (`@yapyak/astro`, `@yapyak/sveltekit`, etc.).',
  },
  PERSISTENCE_LOCAL_STORAGE_SSR_SKIPPED: {
    code: 'YAP0024',
    message: (): string =>
      'setLocale() skipped on the server with persistence `local-storage`. `localStorage` is browser-only. Use persistence `cookie` for SSR-compatible locale switching.',
  },
  PERSISTENCE_LOCAL_STORAGE_WRITE_FAILED: {
    code: 'YAP0025',
    message: (): string =>
      'setLocale() failed to write to `localStorage`. The in-memory locale was updated but will not survive a reload. Common causes are quota exceeded, Safari private mode, or storage disabled.',
  },
  PERSISTENCE_URL_SKIPPED: {
    code: 'YAP0026',
    message: (): string =>
      'setLocale() skipped with persistence `url`. The URL is the source of truth. Drive locale switches through router navigation.',
  },
  LOCALE_LISTENER_THREW: {
    code: 'YAP0027',
    message: (): string =>
      'Locale subscriber threw an exception. Yapyak continued with the remaining subscribers.',
  },
  LOCALE_SET_IGNORED: {
    code: 'YAP0028',
    message: ({ value }: { value: string }): string =>
      `setLocale call ignored. Value "${value}" is not in the configured locales.`,
  },
  LOCALE_SET_SSR_LEAK_RISK: {
    code: 'YAP0029',
    message: (): string =>
      'setLocale call ignored on the server. Mutating the shared module-global locale leaks between concurrent requests. Configure `cookie` or `url` persistence, or drive locale switches through router navigation.',
  },
  LOCALE_FORCED_INVALID: {
    code: 'YAP0030',
    message: ({
      defaultLocale,
      requested,
    }: {
      defaultLocale: string;
      requested: string;
    }): string =>
      `Forced locale "${requested}" is not a valid BCP 47 tag. Falling back to default "${defaultLocale}".`,
  },
  CATALOG_LOCALE_FILE_CORRUPT: {
    code: 'YAP0031',
    message: ({ detail }: { detail: string }): string => detail,
  },
  CATALOG_ORPHAN_CACHE_CORRUPT: {
    code: 'YAP0032',
    message: ({ detail }: { detail: string }): string => detail,
  },
  TRANSLATE_CHUNK_FAILED: {
    code: 'YAP0033',
    message: (): string =>
      'A translate batch chunk failed. Yapyak kept the other chunks and returned partial results.',
  },
  TRANSLATE_ENTRY_SHAPE_INVALID: {
    code: 'YAP0034',
    message: ({ shape }: { shape: string }): string =>
      `Translate result entry is ${shape} instead of an object keyed by target locales. The element was dropped and its translations were left empty.`,
  },
  FORMAT_UNSUPPORTED_CURRENCY: {
    code: 'YAP0035',
    message: ({ code }: { code: string }): string =>
      `Unsupported currency code "${code}". Yapyak rendered the value as "<value> ${code}".`,
  },
  FORMAT_UNSUPPORTED_UNIT: {
    code: 'YAP0036',
    message: ({ unit }: { unit: string }): string =>
      `Unsupported unit "${unit}". Yapyak rendered the value as "<value> ${unit}".`,
  },
  FORMAT_UNSUPPORTED_TIME_ZONE: {
    code: 'YAP0037',
    message: ({ timeZone }: { timeZone: string }): string =>
      `Unsupported time zone "${timeZone}". Yapyak rendered the date in the system time zone.`,
  },
  CATALOG_MIGRATION_FAILED: {
    code: 'YAP0039',
    message: ({ detail, locale }: { detail: string; locale: string }): string =>
      `Locale migration for "${locale}" failed: ${detail}. Yapyak skipped this locale and continued.`,
  },
  TRACKER_THREW: {
    code: 'YAP0040',
    message: (): string =>
      'Tracker callback threw an exception. Yapyak continued with the remaining trackers.',
  },
  CATALOG_LOCALE_FILE_UNREADABLE: {
    code: 'YAP0047',
    message: ({ path, reason }: { path: string; reason: string }): string =>
      `Locale file ${path} is not readable (${reason}). Check the file permissions and the open-file limit, then restart the dev server.`,
  },
} as const;

export type YapCode =
  | (typeof YAP_COMPILE)[keyof typeof YAP_COMPILE]['code']
  | (typeof YAP_RUNTIME)[keyof typeof YAP_RUNTIME]['code'];

export type Diagnostic = {
  code: YapCode;
  fileId: string;
  hint?: string;
  message: string;
  range: Range;
  severity: 'error' | 'warning';
};

export type BuildDiagnosticContext = {
  fileId: string;
  range: Range;
  severity: 'error' | 'warning';
};

export function getDocsUrl(code: YapCode): string {
  return `${DOCS_BASE}/${code}`;
}

export function warnDiagnostic<T extends keyof typeof YAP_RUNTIME>(
  key: T,
  params: Parameters<(typeof YAP_RUNTIME)[T]['message']>[0],
  meta?: Record<string, unknown>,
): void {
  const entry = YAP_RUNTIME[key];
  const url = getDocsUrl(entry.code);
  const message = (entry.message as (input: typeof params) => string)(params);
  warn(`${entry.code} ${message}\nSee ${url}`, {
    code: entry.code,
    ...meta,
  });
}

export function buildDiagnostic<T extends keyof typeof YAP_COMPILE>(
  key: T,
  params: Parameters<(typeof YAP_COMPILE)[T]['message']>[0],
  context: BuildDiagnosticContext,
): Diagnostic {
  const entry = YAP_COMPILE[key];
  const message = (entry.message as (input: typeof params) => string)(params);
  const hint =
    'hint' in entry
      ? (entry.hint as (input: typeof params) => string)(params)
      : undefined;
  return {
    code: entry.code,
    fileId: context.fileId,
    hint,
    message,
    range: context.range,
    severity: context.severity,
  };
}
