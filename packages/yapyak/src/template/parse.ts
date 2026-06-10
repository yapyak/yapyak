import type { TemplateDiagnostic } from './diagnostic';
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

const APOSTROPHE_ESCAPE_RX = /'[#'<>{}]/;
const PLURAL_OFFSET_RX = /\boffset:\d+/;

export interface ParseTemplateResult {
  diagnostics: TemplateDiagnostic[];
  template: Template;
}

export function parseTemplate(source: string): ParseTemplateResult {
  const diagnostics: TemplateDiagnostic[] = [];
  if (APOSTROPHE_ESCAPE_RX.test(source)) {
    diagnostics.push({
      feature: 'apostrophe escaping',
      name: '',
      reason: 'unsupported',
    });
  }
  const context: ParseContext = { diagnostics, source };
  const template = parseNodes(context, 0, false, null).value;
  return { diagnostics, template };
}

interface ParseContext {
  diagnostics: TemplateDiagnostic[];
  source: string;
}

interface ParseResult<T> {
  next: number;
  value: T;
}

function parseNodes(
  context: ParseContext,
  start: number,
  isInPluralBranch: boolean,
  terminator: '}' | null,
): ParseResult<Template> {
  const nodes: Template = [];
  let position = start;
  while (position < context.source.length) {
    const character = context.source[position];
    if (character === terminator) {
      break;
    }
    if (character === '}' && terminator === null) {
      context.diagnostics.push({
        message: `unbalanced '}' at index ${position}: missing opening '{'`,
        reason: 'malformed',
      });
      nodes.push({ kind: 'literal', value: '}' });
      position++;
      continue;
    }
    const node = parseNode(context, position, isInPluralBranch);
    if (node === null) {
      break;
    }
    nodes.push(node.value);
    position = node.next;
  }
  return { next: position, value: nodes };
}

function parseNode(
  context: ParseContext,
  position: number,
  isInPluralBranch: boolean,
): ParseResult<TemplateNode> | null {
  return (
    parseToken(context, position, isInPluralBranch) ??
    parseCount(context, position, isInPluralBranch) ??
    parseLiteral(context, position, isInPluralBranch)
  );
}

function parseLiteral(
  context: ParseContext,
  position: number,
  isInPluralBranch: boolean,
): ParseResult<TemplateNode> | null {
  let end = position;
  while (end < context.source.length) {
    const character = context.source[end];
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
    value: context.source.slice(position, end),
  };
  return { next: end, value: node };
}

function parseCount(
  context: ParseContext,
  position: number,
  isInPluralBranch: boolean,
): ParseResult<TemplateNode> | null {
  if (!isInPluralBranch) {
    return null;
  }
  if (context.source[position] !== '#') {
    return null;
  }
  const node: CountNode = { kind: 'count' };
  return { next: position + 1, value: node };
}

function parseToken(
  context: ParseContext,
  position: number,
  isInPluralBranch: boolean,
): ParseResult<TemplateNode> | null {
  if (context.source[position] !== '{') {
    return null;
  }
  const closeIndex = findMatchingBrace(context.source, position);
  if (closeIndex === undefined) {
    context.diagnostics.push({
      message: `unbalanced '{' at index ${position}: missing closing '}'`,
      reason: 'malformed',
    });
    const node: LiteralNode = {
      kind: 'literal',
      value: context.source.slice(position),
    };
    return { next: context.source.length, value: node };
  }
  const node = parseTokenBody(
    context,
    position + 1,
    closeIndex,
    isInPluralBranch,
  );
  return { next: closeIndex + 1, value: node };
}

function parseTokenBody(
  context: ParseContext,
  start: number,
  end: number,
  isInPluralBranch: boolean,
): TemplateNode {
  const firstComma = findTopLevelComma(context.source, start, end);
  if (firstComma === -1) {
    const name = context.source.slice(start, end).trim();
    if (name === '') {
      context.diagnostics.push({
        message: 'empty argument',
        reason: 'malformed',
      });
    }
    return { kind: 'placeholder', name };
  }
  const name = context.source.slice(start, firstComma).trim();
  const afterName = firstComma + 1;
  const secondComma = findTopLevelComma(context.source, afterName, end);
  const kindEnd = secondComma === -1 ? end : secondComma;
  const kind = context.source.slice(afterName, kindEnd).trim();
  const bodyStart = secondComma === -1 ? end : secondComma + 1;
  if (kind === 'plural') {
    return buildPluralNode(context, name, 'cardinal', bodyStart, end);
  }
  if (kind === 'selectordinal') {
    return buildPluralNode(context, name, 'ordinal', bodyStart, end);
  }
  if (kind === 'select') {
    return buildSelectNode(context, name, bodyStart, end, isInPluralBranch);
  }
  if (kind === 'number') {
    return buildNumberNode(
      context,
      name,
      context.source.slice(bodyStart, end).trim(),
    );
  }
  if (kind === 'date') {
    return buildDateNode(
      context,
      name,
      context.source.slice(bodyStart, end).trim(),
    );
  }
  if (kind === 'time') {
    return buildTimeNode(
      context,
      name,
      context.source.slice(bodyStart, end).trim(),
    );
  }
  context.diagnostics.push({
    message: `unknown argument type "${kind}"`,
    reason: 'malformed',
  });
  return { kind: 'placeholder', name };
}

function buildPluralNode(
  context: ParseContext,
  name: string,
  type: 'cardinal' | 'ordinal',
  bodyStart: number,
  bodyEnd: number,
): PluralNode {
  const bodyText = context.source.slice(bodyStart, bodyEnd);
  if (PLURAL_OFFSET_RX.test(bodyText)) {
    context.diagnostics.push({
      feature: 'plural offset',
      name,
      reason: 'unsupported',
    });
  }
  const branches = parseBranches(context, bodyStart, bodyEnd, true);
  if (!branches.has('other')) {
    context.diagnostics.push({ name, reason: 'missing-other' });
  }
  return { branches, kind: 'plural', name, type };
}

function buildSelectNode(
  context: ParseContext,
  name: string,
  bodyStart: number,
  bodyEnd: number,
  isInPluralBranch: boolean,
): SelectNode {
  const branches = parseBranches(context, bodyStart, bodyEnd, isInPluralBranch);
  if (!branches.has('other')) {
    context.diagnostics.push({ name, reason: 'missing-other' });
  }
  return { branches, kind: 'select', name };
}

function buildNumberNode(
  context: ParseContext,
  name: string,
  body: string,
): NumberNode {
  return {
    kind: 'number',
    name,
    options: resolveNumberOptions(context, name, body),
  };
}

function buildDateNode(
  context: ParseContext,
  name: string,
  body: string,
): DateNode {
  return {
    kind: 'date',
    name,
    style: resolveDateTimeStyle(context, name, 'date', body),
  };
}

function buildTimeNode(
  context: ParseContext,
  name: string,
  body: string,
): TimeNode {
  return {
    kind: 'time',
    name,
    style: resolveDateTimeStyle(context, name, 'time', body),
  };
}

function parseBranches(
  context: ParseContext,
  start: number,
  end: number,
  isInPluralBranch: boolean,
): Map<string, Template> {
  const branches = new Map<string, Template>();
  let position = start;
  while (position < end) {
    while (position < end && isWhitespace(context.source[position])) {
      position++;
    }
    if (position >= end) {
      break;
    }
    let nameEnd = position;
    while (
      nameEnd < end &&
      !isWhitespace(context.source[nameEnd]) &&
      context.source[nameEnd] !== '{'
    ) {
      nameEnd++;
    }
    const branchName = context.source.slice(position, nameEnd);
    position = nameEnd;
    while (position < end && isWhitespace(context.source[position])) {
      position++;
    }
    if (context.source[position] !== '{') {
      continue;
    }
    const closeIndex = findMatchingBrace(context.source, position);
    if (closeIndex === undefined) {
      context.diagnostics.push({
        message: `unbalanced '{' at index ${position}: missing closing '}'`,
        reason: 'malformed',
      });
      break;
    }
    const inner = parseNodes(context, position + 1, isInPluralBranch, '}');
    branches.set(branchName, inner.value);
    position = closeIndex + 1;
  }
  return branches;
}

function findMatchingBrace(
  source: string,
  openIndex: number,
): number | undefined {
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
    return undefined;
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

function resolveNumberOptions(
  context: ParseContext,
  name: string,
  body: string,
): Intl.NumberFormatOptions {
  if (body === '' || body === 'decimal') {
    return {};
  }
  if (body === 'percent') {
    return { style: 'percent' };
  }
  if (body === 'integer') {
    return { maximumFractionDigits: 0 };
  }
  if (body === 'currency') {
    context.diagnostics.push({
      feature: 'currency without a code',
      name,
      reason: 'unsupported',
    });
    return {};
  }
  if (body.startsWith('currency')) {
    const currencyCode = body.slice('currency'.length).trim();
    if (currencyCode !== '') {
      return { currency: currencyCode, style: 'currency' };
    }
  }
  if (body.startsWith('::')) {
    context.diagnostics.push({
      feature: 'number skeleton',
      name,
      reason: 'unsupported',
    });
    return {};
  }
  context.diagnostics.push({
    feature: `number style "${body}"`,
    name,
    reason: 'unsupported',
  });
  return {};
}

function resolveDateTimeStyle(
  context: ParseContext,
  name: string,
  kind: 'date' | 'time',
  body: string,
): DateTimeStyle {
  if (body === '') {
    return 'medium';
  }
  if (
    body === 'short' ||
    body === 'medium' ||
    body === 'long' ||
    body === 'full'
  ) {
    return body;
  }
  context.diagnostics.push({
    feature: `${kind} skeleton or custom pattern`,
    name,
    reason: 'unsupported',
  });
  return 'medium';
}
