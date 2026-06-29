import type { Template, TemplateNode } from '../../../../template';

import { parseTemplate } from '../../../../template';

export type PickLocaleTextInput = {
  defaultLocale: string;
  id: string;
  locale: string;
  source: string;
  translations: Record<string, Record<string, string>>;
};

export type BuildCatalogLiteralInput = {
  defaultLocale: string;
  id: string;
  locales: string[];
  source: string;
  translations: Record<string, Record<string, string>>;
};

export function toSafeJsString(text: string): string {
  let output = "'";
  for (const character of text) {
    const code = character.charCodeAt(0);
    switch (character) {
      case '\\':
        output += '\\\\';
        break;
      case "'":
        output += '\\u0027';
        break;
      case '"':
        output += '\\u0022';
        break;
      case '{':
        output += '\\u007b';
        break;
      case '}':
        output += '\\u007d';
        break;
      case '\n':
        output += '\\n';
        break;
      case '\r':
        output += '\\r';
        break;
      case '\t':
        output += '\\t';
        break;
      case '\b':
        output += '\\b';
        break;
      case '\f':
        output += '\\f';
        break;
      default:
        if (code < 0x20 || code === 0x20_28 || code === 0x20_29) {
          output += `\\u${code.toString(16).padStart(4, '0')}`;
        } else {
          output += character;
        }
    }
  }
  output += "'";
  return output;
}

export function pickLocaleText(input: PickLocaleTextInput): string {
  if (input.locale === input.defaultLocale) {
    return input.source;
  }
  const localeMap = input.translations[input.locale];
  if (!localeMap) {
    return input.source;
  }
  const text = localeMap[input.id];
  return text ?? input.source;
}

export function renderLocaleKey(locale: string): string {
  if (/^[A-Z_$a-z][\w$]*$/.test(locale)) {
    return locale;
  }
  return JSON.stringify(locale);
}

export function isStaticTemplate(template: Template): boolean {
  if (template.length === 0) {
    return true;
  }
  for (const node of template) {
    if (node.kind !== 'literal') {
      return false;
    }
  }
  return true;
}

export function buildCatalogLiteral(
  input: BuildCatalogLiteralInput,
  usedFactories: Set<string>,
  localsByFactory: Map<string, string>,
): string {
  const { defaultLocale, id, locales, source, translations } = input;
  const entries: string[] = [];
  for (const locale of locales) {
    const text = pickLocaleText({
      defaultLocale,
      id,
      locale,
      source,
      translations,
    });
    entries.push(
      `${renderLocaleKey(locale)}: ${renderVariantValue(text, usedFactories, localsByFactory)}`,
    );
  }
  return `{ ${entries.join(', ')} }`;
}

function renderVariantValue(
  text: string,
  usedFactories: Set<string>,
  localsByFactory: Map<string, string>,
): string {
  const { template } = parseTemplate(text);
  if (isStaticTemplate(template)) {
    return toSafeJsString(text);
  }
  return renderTemplateLiteral(template, usedFactories, localsByFactory);
}

function renderTemplateLiteral(
  template: Template,
  usedFactories: Set<string>,
  localsByFactory: Map<string, string>,
): string {
  return `[${template.map((node) => renderNode(node, usedFactories, localsByFactory)).join(',')}]`;
}

function renderNode(
  node: TemplateNode,
  usedFactories: Set<string>,
  localsByFactory: Map<string, string>,
): string {
  const localFor = (factory: string): string =>
    localsByFactory.get(factory) ?? `_${factory}`;
  switch (node.kind) {
    case 'literal':
      usedFactories.add('literal');
      return `${localFor('literal')}(${JSON.stringify(node.value)})`;
    case 'placeholder':
      usedFactories.add('placeholder');
      return `${localFor('placeholder')}(${JSON.stringify(node.name)})`;
    case 'count':
      usedFactories.add('count');
      return `${localFor('count')}()`;
    case 'plural':
      usedFactories.add('plural');
      return `${localFor('plural')}(${JSON.stringify(node.name)},${JSON.stringify(node.pluralKind)},${renderBranches(node.branches, usedFactories, localsByFactory)})`;
    case 'select':
      usedFactories.add('select');
      return `${localFor('select')}(${JSON.stringify(node.name)},${renderBranches(node.branches, usedFactories, localsByFactory)})`;
    case 'number':
      usedFactories.add('number');
      return `${localFor('number')}(${JSON.stringify(node.name)},${JSON.stringify(node.options)})`;
    case 'date':
      usedFactories.add('date');
      return `${localFor('date')}(${JSON.stringify(node.name)},${JSON.stringify(node.style)})`;
    case 'time':
      usedFactories.add('time');
      return `${localFor('time')}(${JSON.stringify(node.name)},${JSON.stringify(node.style)})`;
    default:
      return '';
  }
}

function renderBranches(
  branches: Record<string, Template>,
  usedFactories: Set<string>,
  localsByFactory: Map<string, string>,
): string {
  const entries = Object.entries(branches).map(
    ([name, template]) =>
      `${JSON.stringify(name)}:${renderTemplateLiteral(template, usedFactories, localsByFactory)}`,
  );
  return `{${entries.join(',')}}`;
}
