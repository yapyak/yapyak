import type { Completion } from '../completion';

const DATE_STYLES = [
  'short',
  'medium',
  'long',
  'full',
];

export function buildSourceCompletions(
  source: string,
  offset: number,
): Completion[] {
  const open = findOpenBrace(source, offset);
  if (open === undefined) {
    return [];
  }
  const close = source[offset] === '}' ? '' : '}';
  const parts = splitTopLevel(source.slice(open + 1, offset));
  if (parts.length === 1) {
    return parts[0] === '' ? buildPlaceholders(close) : [];
  }
  if (parts.length === 2) {
    return buildKinds(close);
  }
  if (parts.length === 3) {
    return buildStyles(parts[1]?.trim() ?? '', parts[2] ?? '', close);
  }
  return [];
}

function buildPlaceholders(close: string): Completion[] {
  return [
    {
      detail: 'a value interpolated as text',
      insertText: `\${1:name}${close}`,
      label: '{name}',
    },
    ...buildKinds(close).map((kind) => ({
      detail: kind.detail,
      insertText: `\${1:value}, ${kind.insertText}`,
      label: `{value, ${kind.label}}`,
    })),
  ];
}

function buildKinds(close: string): Completion[] {
  return [
    {
      detail: 'a count that selects a branch',
      insertText: `plural, one {# \${2:one}} other {# \${3:many}}${close}`,
      label: 'plural',
    },
    {
      detail: 'an ordinal that selects a branch',
      insertText: `selectordinal, one {\${2:#st}} other {\${3:#th}}${close}`,
      label: 'selectordinal',
    },
    {
      detail: 'a value that selects a branch by name',
      insertText: `select, \${2:case} {\${3:text}} other {\${4:text}}${close}`,
      label: 'select',
    },
    {
      detail: 'a number formatted for the locale',
      insertText: `number${close}`,
      label: 'number',
    },
    {
      detail: 'a date formatted for the locale',
      insertText: `date, \${2|short,medium,long,full|}${close}`,
      label: 'date',
    },
    {
      detail: 'a time formatted for the locale',
      insertText: `time, \${2|short,medium,long,full|}${close}`,
      label: 'time',
    },
  ];
}

function buildStyles(kind: string, style: string, close: string): Completion[] {
  if (kind === 'number') {
    if (style.trimStart().startsWith('currency')) {
      return buildCurrencies(close);
    }
    return [
      {
        detail: 'no decimals',
        insertText: `integer${close}`,
        label: 'integer',
      },
      {
        detail: 'formatted as a percentage',
        insertText: `percent${close}`,
        label: 'percent',
      },
      {
        detail: 'an amount in an ISO 4217 currency',
        insertText: `currency \${1:EUR}${close}`,
        label: 'currency',
      },
    ];
  }
  if (kind === 'date' || kind === 'time') {
    return DATE_STYLES.map((style) => ({
      detail: `${kind} style`,
      insertText: `${style}${close}`,
      label: style,
    }));
  }
  return [];
}

function buildCurrencies(close: string): Completion[] {
  const names = new Intl.DisplayNames(
    [
      'en',
    ],
    {
      type: 'currency',
    },
  );
  return Intl.supportedValuesOf('currency').map((currency) => ({
    detail: names.of(currency) ?? currency,
    insertText: `${currency}${close}`,
    label: currency,
  }));
}

function findOpenBrace(source: string, offset: number): number | undefined {
  let depth = 0;
  let index = offset - 1;
  while (index >= 0) {
    const character = source[index];
    if (character === '}') {
      depth += 1;
    } else if (character === '{') {
      if (depth === 0) {
        return index;
      }
      depth -= 1;
    }
    index -= 1;
  }
  return undefined;
}

function splitTopLevel(inner: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  let index = 0;
  while (index < inner.length) {
    const character = inner[index];
    if (character === '{') {
      depth += 1;
    } else if (character === '}') {
      depth -= 1;
    } else if (character === ',' && depth === 0) {
      parts.push(inner.slice(start, index));
      start = index + 1;
    }
    index += 1;
  }
  parts.push(inner.slice(start));
  return parts;
}
