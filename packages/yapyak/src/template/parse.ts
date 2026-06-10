import type { TemplateDiagnostic, TemplateRange } from './diagnostic';
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
  const apostropheMatch = APOSTROPHE_ESCAPE_RX.exec(source);
  if (apostropheMatch) {
    diagnostics.push({
      feature: 'apostrophe escaping',
      name: '',
      range: {
        end: apostropheMatch.index + apostropheMatch[0].length,
        start: apostropheMatch.index,
      },
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
        range: { end: position + 1, start: position },
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
      range: { end: context.source.length, start: position },
      reason: 'malformed',
    });
    const node: LiteralNode = {
      kind: 'literal',
      value: context.source.slice(position),
    };
    return { next: context.source.length, value: node };
  }
  const node = parseTokenBody(context, {
    innerEnd: closeIndex,
    innerStart: position + 1,
    isInPluralBranch,
    tokenRange: { end: closeIndex + 1, start: position },
  });
  return { next: closeIndex + 1, value: node };
}

interface ParseTokenBodyInput {
  innerEnd: number;
  innerStart: number;
  isInPluralBranch: boolean;
  tokenRange: TemplateRange;
}

function parseTokenBody(
  context: ParseContext,
  input: ParseTokenBodyInput,
): TemplateNode {
  const { innerEnd, innerStart, isInPluralBranch, tokenRange } = input;
  const firstComma = findTopLevelComma(context.source, innerStart, innerEnd);
  if (firstComma === undefined) {
    const name = context.source.slice(innerStart, innerEnd).trim();
    if (name === '') {
      context.diagnostics.push({
        message: 'empty argument',
        range: tokenRange,
        reason: 'malformed',
      });
    }
    return { kind: 'placeholder', name };
  }
  const name = context.source.slice(innerStart, firstComma).trim();
  const afterName = firstComma + 1;
  const secondComma = findTopLevelComma(context.source, afterName, innerEnd);
  const kindEnd = secondComma === undefined ? innerEnd : secondComma;
  const kind = context.source.slice(afterName, kindEnd).trim();
  const bodyStart = secondComma === undefined ? innerEnd : secondComma + 1;
  if (kind === 'plural') {
    return buildPluralNode(context, {
      bodyEnd: innerEnd,
      bodyStart,
      name,
      tokenRange,
      type: 'cardinal',
    });
  }
  if (kind === 'selectordinal') {
    return buildPluralNode(context, {
      bodyEnd: innerEnd,
      bodyStart,
      name,
      tokenRange,
      type: 'ordinal',
    });
  }
  if (kind === 'select') {
    return buildSelectNode(context, {
      bodyEnd: innerEnd,
      bodyStart,
      isInPluralBranch,
      name,
      tokenRange,
    });
  }
  const bodyRange = trimmedRange(context.source, bodyStart, innerEnd);
  if (kind === 'number') {
    return buildNumberNode(context, { bodyRange, name });
  }
  if (kind === 'date') {
    return buildDateNode(context, { bodyRange, name });
  }
  if (kind === 'time') {
    return buildTimeNode(context, { bodyRange, name });
  }
  context.diagnostics.push({
    message: `unknown argument type "${kind}"`,
    range: trimmedRange(context.source, afterName, kindEnd),
    reason: 'malformed',
  });
  return { kind: 'placeholder', name };
}

interface BuildPluralNodeInput {
  bodyEnd: number;
  bodyStart: number;
  name: string;
  tokenRange: TemplateRange;
  type: 'cardinal' | 'ordinal';
}

function buildPluralNode(
  context: ParseContext,
  input: BuildPluralNodeInput,
): PluralNode {
  const bodyText = context.source.slice(input.bodyStart, input.bodyEnd);
  const offsetMatch = PLURAL_OFFSET_RX.exec(bodyText);
  if (offsetMatch) {
    context.diagnostics.push({
      feature: 'plural offset',
      name: input.name,
      range: {
        end: input.bodyStart + offsetMatch.index + offsetMatch[0].length,
        start: input.bodyStart + offsetMatch.index,
      },
      reason: 'unsupported',
    });
  }
  const branches = parseBranches(context, input.bodyStart, input.bodyEnd, true);
  if (!('other' in branches)) {
    context.diagnostics.push({
      name: input.name,
      range: input.tokenRange,
      reason: 'missing-other',
    });
  }
  return { branches, kind: 'plural', name: input.name, type: input.type };
}

interface BuildSelectNodeInput {
  bodyEnd: number;
  bodyStart: number;
  isInPluralBranch: boolean;
  name: string;
  tokenRange: TemplateRange;
}

function buildSelectNode(
  context: ParseContext,
  input: BuildSelectNodeInput,
): SelectNode {
  const branches = parseBranches(
    context,
    input.bodyStart,
    input.bodyEnd,
    input.isInPluralBranch,
  );
  if (!('other' in branches)) {
    context.diagnostics.push({
      name: input.name,
      range: input.tokenRange,
      reason: 'missing-other',
    });
  }
  return { branches, kind: 'select', name: input.name };
}

interface BuildFormatNodeInput {
  bodyRange: TemplateRange;
  name: string;
}

function buildNumberNode(
  context: ParseContext,
  input: BuildFormatNodeInput,
): NumberNode {
  return {
    kind: 'number',
    name: input.name,
    options: resolveNumberOptions(context, input),
  };
}

function buildDateNode(
  context: ParseContext,
  input: BuildFormatNodeInput,
): DateNode {
  return {
    kind: 'date',
    name: input.name,
    style: resolveDateTimeStyle(context, 'date', input),
  };
}

function buildTimeNode(
  context: ParseContext,
  input: BuildFormatNodeInput,
): TimeNode {
  return {
    kind: 'time',
    name: input.name,
    style: resolveDateTimeStyle(context, 'time', input),
  };
}

function parseBranches(
  context: ParseContext,
  start: number,
  end: number,
  isInPluralBranch: boolean,
): Record<string, Template> {
  const branches: Record<string, Template> = {};
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
        range: { end: context.source.length, start: position },
        reason: 'malformed',
      });
      break;
    }
    const inner = parseNodes(context, position + 1, isInPluralBranch, '}');
    branches[branchName] = inner.value;
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

function findTopLevelComma(
  source: string,
  start: number,
  end: number,
): number | undefined {
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
  return undefined;
}

function isWhitespace(character: string | undefined): boolean {
  return (
    character === ' ' ||
    character === '\t' ||
    character === '\n' ||
    character === '\r'
  );
}

function trimmedRange(
  source: string,
  start: number,
  end: number,
): TemplateRange {
  let trimmedStart = start;
  while (trimmedStart < end && isWhitespace(source[trimmedStart])) {
    trimmedStart++;
  }
  let trimmedEnd = end;
  while (trimmedEnd > trimmedStart && isWhitespace(source[trimmedEnd - 1])) {
    trimmedEnd--;
  }
  if (trimmedStart === trimmedEnd) {
    return { end, start };
  }
  return { end: trimmedEnd, start: trimmedStart };
}

function resolveNumberOptions(
  context: ParseContext,
  input: BuildFormatNodeInput,
): Intl.NumberFormatOptions {
  const body = context.source
    .slice(input.bodyRange.start, input.bodyRange.end)
    .trim();
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
      name: input.name,
      range: input.bodyRange,
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
      name: input.name,
      range: input.bodyRange,
      reason: 'unsupported',
    });
    return {};
  }
  context.diagnostics.push({
    feature: `number style "${body}"`,
    name: input.name,
    range: input.bodyRange,
    reason: 'unsupported',
  });
  return {};
}

function resolveDateTimeStyle(
  context: ParseContext,
  kind: 'date' | 'time',
  input: BuildFormatNodeInput,
): DateTimeStyle {
  const body = context.source
    .slice(input.bodyRange.start, input.bodyRange.end)
    .trim();
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
    name: input.name,
    range: input.bodyRange,
    reason: 'unsupported',
  });
  return 'medium';
}
