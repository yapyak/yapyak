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
import { warn } from '../warn';

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
    case 'placeholder':
      return interpretPlaceholder(node.name, params);
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
    default:
      return '';
  }
}

function readParam(params: Record<string, unknown>, name: string): unknown {
  return Object.hasOwn(params, name) ? params[name] : undefined;
}

function interpretPlaceholder(
  name: string,
  params: Record<string, unknown>,
): string {
  const value = readParam(params, name);
  if (value === undefined) {
    warn(`Missing placeholder "${name}" — rendered as empty string.`);
    return '';
  }
  if (value === null) {
    warn(`Placeholder "${name}" got \`null\` — rendered as "null".`);
    return 'null';
  }
  if (typeof value === 'object') {
    const rendered = String(value);
    warn(`Placeholder "${name}" got an object — rendered as "${rendered}".`, {
      value,
    });
    return rendered;
  }
  return String(value);
}

function interpretPlural(
  node: PluralNode,
  params: Record<string, unknown>,
  locale: string,
): string {
  const raw = readParam(params, node.name);
  if (raw === undefined || raw === null || raw === '') {
    warn(`Plural "${node.name}" missing — falling to the "other" branch.`, {
      value: raw,
    });
    return interpretNodes(node.branches.other ?? [], params, locale, '');
  }
  const count = Number(raw);
  if (Number.isNaN(count)) {
    warn(
      `Plural "${node.name}" expected a number, got \`${typeof raw}\` — falling to the "other" branch.`,
      {
        value: raw,
      },
    );
    return interpretNodes(node.branches.other ?? [], params, locale, '');
  }
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
  const raw = readParam(params, node.name);
  const value = String(raw);
  const directBranch = node.branches[value];
  if (directBranch) {
    return interpretNodes(directBranch, params, locale, formattedCount);
  }
  if (typeof raw !== 'string') {
    warn(
      `Select "${node.name}" expected a string, got \`${typeof raw}\` — falling to the "other" branch.`,
      {
        value: raw,
      },
    );
  }
  const branch = node.branches.other ?? [];
  return interpretNodes(branch, params, locale, formattedCount);
}

function interpretNumber(
  node: NumberNode,
  params: Record<string, unknown>,
  locale: string,
): string {
  const raw = readParam(params, node.name);
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
  const date = toDate(readParam(params, node.name));
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
  const date = toDate(readParam(params, node.name));
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
