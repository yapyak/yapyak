import type {
  CountNode,
  DateNode,
  DateTimeStyle,
  LiteralNode,
  NumberNode,
  PluralNode,
  SelectNode,
  Template,
  TemplateNode,
  TimeNode,
} from './node';

import { warn } from '../warn';

export function parseTemplate(source: string): Template {
  const result = parseNodes(source, 0, false, null);
  if (result.next < source.length) {
    throw new Error(
      `Unbalanced '}' at index ${result.next} in interpolation template: missing opening '{'.`,
    );
  }
  return result.value;
}

interface ParseResult<T> {
  next: number;
  value: T;
}

function parseNodes(
  source: string,
  start: number,
  isInPluralBranch: boolean,
  terminator: '}' | null,
): ParseResult<Template> {
  const nodes: Template = [];
  let position = start;
  while (position < source.length) {
    const character = source[position];
    if (character === terminator) {
      break;
    }
    if (character === '}' && terminator === null) {
      throw new Error(
        `Unbalanced '}' at index ${position} in interpolation template: missing opening '{'.`,
      );
    }
    const node = parseNode(source, position, isInPluralBranch);
    if (node === null) {
      throw new Error(
        `Unexpected character '${character ?? ''}' at index ${position} in interpolation template.`,
      );
    }
    nodes.push(node.value);
    position = node.next;
  }
  return { next: position, value: nodes };
}

function parseNode(
  source: string,
  position: number,
  isInPluralBranch: boolean,
): ParseResult<TemplateNode> | null {
  return (
    parseToken(source, position, isInPluralBranch) ??
    parseCount(source, position, isInPluralBranch) ??
    parseLiteral(source, position, isInPluralBranch)
  );
}

function parseLiteral(
  source: string,
  position: number,
  isInPluralBranch: boolean,
): ParseResult<TemplateNode> | null {
  let end = position;
  while (end < source.length) {
    const character = source[end];
    if (character === '{' || character === '}') {
      break;
    }
    if (isInPluralBranch && character === '#') {
      break;
    }
    end++;
  }
  if (end === position) {
    return null;
  }
  const node: LiteralNode = {
    kind: 'literal',
    value: source.slice(position, end),
  };
  return { next: end, value: node };
}

function parseCount(
  source: string,
  position: number,
  isInPluralBranch: boolean,
): ParseResult<TemplateNode> | null {
  if (!isInPluralBranch) {
    return null;
  }
  if (source[position] !== '#') {
    return null;
  }
  const node: CountNode = { kind: 'count' };
  return { next: position + 1, value: node };
}

function parseToken(
  source: string,
  position: number,
  isInPluralBranch: boolean,
): ParseResult<TemplateNode> | null {
  if (source[position] !== '{') {
    return null;
  }
  const closeIndex = findMatchingBrace(source, position);
  const bodyStart = position + 1;
  const bodyEnd = closeIndex;
  const node = parseTokenBody(source, bodyStart, bodyEnd, isInPluralBranch);
  return { next: closeIndex + 1, value: node };
}

function parseTokenBody(
  source: string,
  start: number,
  end: number,
  isInPluralBranch: boolean,
): TemplateNode {
  const firstComma = findTopLevelComma(source, start, end);
  if (firstComma === -1) {
    const name = source.slice(start, end).trim();
    return { kind: 'placeholder', name };
  }
  const name = source.slice(start, firstComma).trim();
  const afterName = firstComma + 1;
  const secondComma = findTopLevelComma(source, afterName, end);
  const kindEnd = secondComma === -1 ? end : secondComma;
  const kind = source.slice(afterName, kindEnd).trim();
  const bodyStart = secondComma === -1 ? end : secondComma + 1;
  if (kind === 'plural') {
    return buildPluralNode(source, name, 'cardinal', bodyStart, end);
  }
  if (kind === 'selectordinal') {
    return buildPluralNode(source, name, 'ordinal', bodyStart, end);
  }
  if (kind === 'select') {
    return buildSelectNode(source, name, bodyStart, end, isInPluralBranch);
  }
  if (kind === 'number') {
    return buildNumberNode(name, source.slice(bodyStart, end).trim());
  }
  if (kind === 'date') {
    return buildDateNode(name, source.slice(bodyStart, end).trim());
  }
  if (kind === 'time') {
    return buildTimeNode(name, source.slice(bodyStart, end).trim());
  }
  return { kind: 'placeholder', name };
}

function buildPluralNode(
  source: string,
  name: string,
  type: 'cardinal' | 'ordinal',
  bodyStart: number,
  bodyEnd: number,
): PluralNode {
  const branches = parseBranches(source, bodyStart, bodyEnd, true);
  return { branches, kind: 'plural', name, type };
}

function buildSelectNode(
  source: string,
  name: string,
  bodyStart: number,
  bodyEnd: number,
  isInPluralBranch: boolean,
): SelectNode {
  const branches = parseBranches(source, bodyStart, bodyEnd, isInPluralBranch);
  return { branches, kind: 'select', name };
}

function buildNumberNode(name: string, body: string): NumberNode {
  return { kind: 'number', name, options: resolveNumberOptions(body) };
}

function buildDateNode(name: string, body: string): DateNode {
  return { kind: 'date', name, style: resolveDateTimeStyle(body) };
}

function buildTimeNode(name: string, body: string): TimeNode {
  return { kind: 'time', name, style: resolveDateTimeStyle(body) };
}

function parseBranches(
  source: string,
  start: number,
  end: number,
  isInPluralBranch: boolean,
): Map<string, Template> {
  const branches = new Map<string, Template>();
  let position = start;
  while (position < end) {
    while (position < end && isWhitespace(source[position])) {
      position++;
    }
    if (position >= end) {
      break;
    }
    let nameEnd = position;
    while (
      nameEnd < end &&
      !isWhitespace(source[nameEnd]) &&
      source[nameEnd] !== '{'
    ) {
      nameEnd++;
    }
    const branchName = source.slice(position, nameEnd);
    position = nameEnd;
    while (position < end && isWhitespace(source[position])) {
      position++;
    }
    if (source[position] !== '{') {
      break;
    }
    const closeIndex = findMatchingBrace(source, position);
    const inner = parseNodes(source, position + 1, isInPluralBranch, '}');
    branches.set(branchName, inner.value);
    position = closeIndex + 1;
  }
  return branches;
}

function findMatchingBrace(source: string, openIndex: number): number {
  let depth = 1;
  let position = openIndex + 1;
  while (position < source.length && depth > 0) {
    const character = source[position];
    if (character === '{') {
      depth++;
    } else if (character === '}') {
      depth--;
    }
    if (depth > 0) {
      position++;
    }
  }
  if (depth > 0) {
    throw new Error(
      `Unbalanced '{' at index ${openIndex} in interpolation template: missing closing '}'.`,
    );
  }
  return position;
}

function findTopLevelComma(source: string, start: number, end: number): number {
  let depth = 0;
  for (let index = start; index < end; index++) {
    const character = source[index];
    if (character === '{') {
      depth++;
    } else if (character === '}') {
      depth--;
    } else if (character === ',' && depth === 0) {
      return index;
    }
  }
  return -1;
}

function isWhitespace(character: string | undefined): boolean {
  return (
    character === ' ' ||
    character === '\t' ||
    character === '\n' ||
    character === '\r'
  );
}

function resolveNumberOptions(body: string): Intl.NumberFormatOptions {
  if (body === '' || body === 'decimal') {
    return {};
  }
  if (body === 'percent') {
    return { style: 'percent' };
  }
  if (body === 'integer') {
    return { maximumFractionDigits: 0 };
  }
  if (body.startsWith('currency')) {
    const currencyCode = body.slice('currency'.length).trim();
    if (currencyCode !== '') {
      return { currency: currencyCode, style: 'currency' };
    }
  }
  warn(
    'Unknown number style — falling back to default formatting. Expected one of: decimal, percent, currency, integer.',
    { code: 'YPK_UNKNOWN_NUMBER_STYLE', received: body },
  );
  return {};
}

function resolveDateTimeStyle(body: string): DateTimeStyle {
  if (
    body === 'short' ||
    body === 'medium' ||
    body === 'long' ||
    body === 'full'
  ) {
    return body;
  }
  return 'medium';
}
