import type {
  DateNode,
  NumberNode,
  PluralNode,
  SelectNode,
  Template,
  TemplateNode,
  TimeNode,
} from './node';

import { resolveFormatter } from '../formatter';

export function interpret(
  template: Template,
  params: Record<string, unknown>,
  locale: string,
): string {
  return interpretNodes(template, params, locale, undefined);
}

function interpretNodes(
  template: Template,
  params: Record<string, unknown>,
  locale: string,
  formattedCount: string | undefined,
): string {
  let result = '';
  for (const node of template) {
    result += interpretNode(node, params, locale, formattedCount);
  }
  return result;
}

function interpretNode(
  node: TemplateNode,
  params: Record<string, unknown>,
  locale: string,
  formattedCount: string | undefined,
): string {
  switch (node.kind) {
    case 'literal':
      return node.value;
    case 'placeholder': {
      const value = params[node.name];
      return value === undefined ? '' : String(value);
    }
    case 'count':
      return formattedCount ?? '';
    case 'plural':
      return interpretPlural(node, params, locale);
    case 'select':
      return interpretSelect(node, params, locale, formattedCount);
    case 'number':
      return interpretNumber(node, params, locale);
    case 'date':
      return interpretDate(node, params, locale);
    case 'time':
      return interpretTime(node, params, locale);
  }
}

function interpretPlural(
  node: PluralNode,
  params: Record<string, unknown>,
  locale: string,
): string {
  const count = Number(params[node.name]);
  const formattedCount = resolveFormatter(Intl.NumberFormat, locale, {}).format(
    count,
  );
  const exact = node.branches[`=${count}`];
  if (exact !== undefined) {
    return interpretNodes(exact, params, locale, formattedCount);
  }
  const category = resolveFormatter(Intl.PluralRules, locale, {
    type: node.type,
  }).select(count);
  const branch = node.branches[category] ?? node.branches.other ?? [];
  return interpretNodes(branch, params, locale, formattedCount);
}

function interpretSelect(
  node: SelectNode,
  params: Record<string, unknown>,
  locale: string,
  formattedCount: string | undefined,
): string {
  const value = String(params[node.name]);
  const branch = node.branches[value] ?? node.branches.other ?? [];
  return interpretNodes(branch, params, locale, formattedCount);
}

function interpretNumber(
  node: NumberNode,
  params: Record<string, unknown>,
  locale: string,
): string {
  const raw = params[node.name];
  if (raw === undefined || raw === null) {
    return '';
  }
  const numericValue = Number(raw);
  if (Number.isNaN(numericValue)) {
    return String(raw);
  }
  return resolveFormatter(Intl.NumberFormat, locale, node.options).format(
    numericValue,
  );
}

function interpretDate(
  node: DateNode,
  params: Record<string, unknown>,
  locale: string,
): string {
  const date = toDate(params[node.name]);
  if (date === undefined) {
    return '';
  }
  return resolveFormatter(Intl.DateTimeFormat, locale, {
    dateStyle: node.style,
  }).format(date);
}

function interpretTime(
  node: TimeNode,
  params: Record<string, unknown>,
  locale: string,
): string {
  const date = toDate(params[node.name]);
  if (date === undefined) {
    return '';
  }
  return resolveFormatter(Intl.DateTimeFormat, locale, {
    timeStyle: node.style,
  }).format(date);
}

function toDate(value: unknown): Date | undefined {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }
  if (typeof value === 'number' || typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
}
