import type { MessageFormatElement } from '@formatjs/icu-messageformat-parser';

import {
  isArgumentElement,
  isDateElement,
  isNumberElement,
  isPluralElement,
  isSelectElement,
  isTimeElement,
  parse,
} from '@formatjs/icu-messageformat-parser';

export type PlaceholderKind =
  | 'date'
  | 'number'
  | 'plural'
  | 'select'
  | 'selectordinal'
  | 'simple'
  | 'time';

export interface Placeholder {
  kind: PlaceholderKind;
  name: string;
}

export type IcuIssue =
  | { message: string; reason: 'malformed' }
  | { name: string; reason: 'missing-other' }
  | { feature: string; name: string; reason: 'unsupported' };

export interface ParsedMessage {
  issues: IcuIssue[];
  placeholders: Placeholder[];
}

const NUMBER_STYLES = new Set(['decimal', 'integer', 'percent']);
const DATE_TIME_STYLES = new Set(['full', 'long', 'medium', 'short']);
const CURRENCY_WITH_CODE_RX = /^currency\s+\S+$/;
const ESCAPE_RX = /'[#'<>{}]/;

export function parsePlaceholders(source: string): ParsedMessage {
  if (ESCAPE_RX.test(source)) {
    return {
      issues: [
        { feature: 'apostrophe escaping', name: '', reason: 'unsupported' },
      ],
      placeholders: [],
    };
  }
  let elements: MessageFormatElement[];
  try {
    elements = parse(source, { ignoreTag: true, requiresOtherClause: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { issues: [{ message, reason: 'malformed' }], placeholders: [] };
  }
  const placeholdersByName = new Map<string, Placeholder>();
  const issues: IcuIssue[] = [];
  walkElements(elements, placeholdersByName, issues);
  return { issues, placeholders: [...placeholdersByName.values()] };
}

function walkElements(
  elements: MessageFormatElement[],
  placeholdersByName: Map<string, Placeholder>,
  issues: IcuIssue[],
): void {
  for (const element of elements) {
    if (isNumberElement(element)) {
      const feature = detectUnsupportedNumberStyle(element.style);
      if (feature) {
        issues.push({ feature, name: element.value, reason: 'unsupported' });
      }
      registerPlaceholder(placeholdersByName, element.value, 'number');
    } else if (isDateElement(element)) {
      if (isUnsupportedDateTimeStyle(element.style)) {
        issues.push({
          feature: 'date skeleton or custom pattern',
          name: element.value,
          reason: 'unsupported',
        });
      }
      registerPlaceholder(placeholdersByName, element.value, 'date');
    } else if (isTimeElement(element)) {
      if (isUnsupportedDateTimeStyle(element.style)) {
        issues.push({
          feature: 'time skeleton or custom pattern',
          name: element.value,
          reason: 'unsupported',
        });
      }
      registerPlaceholder(placeholdersByName, element.value, 'time');
    } else if (isPluralElement(element)) {
      if (element.offset !== 0) {
        issues.push({
          feature: 'plural offset',
          name: element.value,
          reason: 'unsupported',
        });
      }
      if (!Object.hasOwn(element.options, 'other')) {
        issues.push({ name: element.value, reason: 'missing-other' });
      }
      registerPlaceholder(
        placeholdersByName,
        element.value,
        element.pluralType === 'ordinal' ? 'selectordinal' : 'plural',
      );
      walkOptions(element.options, placeholdersByName, issues);
    } else if (isSelectElement(element)) {
      if (!Object.hasOwn(element.options, 'other')) {
        issues.push({ name: element.value, reason: 'missing-other' });
      }
      registerPlaceholder(placeholdersByName, element.value, 'select');
      walkOptions(element.options, placeholdersByName, issues);
    } else if (isArgumentElement(element)) {
      registerPlaceholder(placeholdersByName, element.value, 'simple');
    }
  }
}

function walkOptions(
  options: Record<string, { value: MessageFormatElement[] }>,
  placeholdersByName: Map<string, Placeholder>,
  issues: IcuIssue[],
): void {
  for (const option of Object.values(options)) {
    walkElements(option.value, placeholdersByName, issues);
  }
}

function registerPlaceholder(
  placeholdersByName: Map<string, Placeholder>,
  name: string,
  kind: PlaceholderKind,
): void {
  if (!placeholdersByName.has(name)) {
    placeholdersByName.set(name, { kind, name });
  }
}

function detectUnsupportedNumberStyle(style: unknown): string | undefined {
  if (style === undefined || style === null) {
    return undefined;
  }
  if (typeof style !== 'string') {
    return 'number skeleton';
  }
  if (NUMBER_STYLES.has(style) || CURRENCY_WITH_CODE_RX.test(style)) {
    return undefined;
  }
  if (style === 'currency') {
    return 'currency without a code';
  }
  return `number style "${style}"`;
}

function isUnsupportedDateTimeStyle(style: unknown): boolean {
  if (style === undefined || style === null) {
    return false;
  }
  if (typeof style !== 'string') {
    return true;
  }
  return !DATE_TIME_STYLES.has(style);
}
