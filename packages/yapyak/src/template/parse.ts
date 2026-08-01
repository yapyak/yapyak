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

import { isCurrency } from '../formatting';

const APOSTROPHE_ESCAPE_RX = /'[#'<>{}]/;
const PLURAL_OFFSET_RX = /\boffset:\d+/;
const EXACT_MATCH_RX = /^=\d+$/;

const KNOWN_PLURAL_KEYWORDS = new Set([
  'few',
  'many',
  'one',
  'other',
  'two',
  'zero',
]);

export type ParseTemplateResult = {
  diagnostics: TemplateDiagnostic[];
  template: Template;
};

const MAX_TEMPLATE_DEPTH = 1000;

export function parseTemplate(source: string): ParseTemplateResult {
  const diagnostics: TemplateDiagnostic[] = [];
  const apostropheMatch = APOSTROPHE_ESCAPE_RX.exec(source);
  if (apostropheMatch) {
    diagnostics.push({
      feature: 'apostrophe escaping',
      kind: 'unsupported',
      name: '',
      range: {
        end: apostropheMatch.index + apostropheMatch[0].length,
        start: apostropheMatch.index,
      },
    });
  }
  const context: ParseContext = {
    depth: 0,
    diagnostics,
    source,
  };
  const template = parseNodes(context, 0, false, undefined).value;
  return {
    diagnostics,
    template,
  };
}

type ParseContext = {
  depth: number;
  diagnostics: TemplateDiagnostic[];
  source: string;
};

type ParseResult<T> = {
  next: number;
  value: T;
};

function parseNodes(
  context: ParseContext,
  start: number,
  isInPluralBranch: boolean,
  terminator: '}' | undefined,
): ParseResult<Template> {
  if (context.depth > MAX_TEMPLATE_DEPTH) {
    const end =
      terminator === '}'
        ? (findMatchingBrace(context.source, start - 1) ??
          context.source.length)
        : context.source.length;
    const value = context.source.slice(start, end);
    return {
      next: end,
      value:
        value === ''
          ? []
          : [
              {
                kind: 'literal',
                value,
              },
            ],
    };
  }
  context.depth += 1;
  const nodes: Template = [];
  let position = start;
  while (position < context.source.length) {
    const character = context.source[position];
    if (character === terminator) {
      break;
    }
    if (character === '}' && terminator === undefined) {
      context.diagnostics.push({
        kind: 'malformed',
        message: `unbalanced '}' at index ${position}: missing opening '{'`,
        range: {
          end: position + 1,
          start: position,
        },
      });
      nodes.push({
        kind: 'literal',
        value: '}',
      });
      position++;
      continue;
    }
    const node = parseNode(context, position, isInPluralBranch);
    if (node === undefined) {
      break;
    }
    nodes.push(node.value);
    position = node.next;
  }
  context.depth -= 1;
  return {
    next: position,
    value: nodes,
  };
}

function parseNode(
  context: ParseContext,
  position: number,
  isInPluralBranch: boolean,
): ParseResult<TemplateNode> | undefined {
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
): ParseResult<TemplateNode> | undefined {
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
    return undefined;
  }
  const node: LiteralNode = {
    kind: 'literal',
    value: context.source.slice(position, end),
  };
  return {
    next: end,
    value: node,
  };
}

function parseCount(
  context: ParseContext,
  position: number,
  isInPluralBranch: boolean,
): ParseResult<TemplateNode> | undefined {
  if (!isInPluralBranch) {
    return undefined;
  }
  if (context.source[position] !== '#') {
    return undefined;
  }
  const node: CountNode = {
    kind: 'count',
  };
  return {
    next: position + 1,
    value: node,
  };
}

function parseToken(
  context: ParseContext,
  position: number,
  isInPluralBranch: boolean,
): ParseResult<TemplateNode> | undefined {
  if (context.source[position] !== '{') {
    return undefined;
  }
  const closeIndex = findMatchingBrace(context.source, position);
  if (closeIndex === undefined) {
    context.diagnostics.push({
      kind: 'malformed',
      message: `unbalanced '{' at index ${position}: missing closing '}'`,
      range: {
        end: context.source.length,
        start: position,
      },
    });
    const node: LiteralNode = {
      kind: 'literal',
      value: context.source.slice(position),
    };
    return {
      next: context.source.length,
      value: node,
    };
  }
  const node = parseTokenBody(
    {
      innerEnd: closeIndex,
      innerStart: position + 1,
      isInPluralBranch,
      tokenRange: {
        end: closeIndex + 1,
        start: position,
      },
    },
    context,
  );
  return {
    next: closeIndex + 1,
    value: node,
  };
}

type ParseTokenBodyInput = {
  innerEnd: number;
  innerStart: number;
  isInPluralBranch: boolean;
  tokenRange: TemplateRange;
};

function parseTokenBody(
  input: ParseTokenBodyInput,
  context: ParseContext,
): TemplateNode {
  const { innerEnd, innerStart, isInPluralBranch, tokenRange } = input;
  const firstComma = findTopLevelComma(context.source, innerStart, innerEnd);
  if (firstComma === undefined) {
    const name = context.source.slice(innerStart, innerEnd).trim();
    emitNameDiagnostic(name, tokenRange, context);
    return {
      kind: 'placeholder',
      name,
    };
  }
  const name = context.source.slice(innerStart, firstComma).trim();
  emitNameDiagnostic(name, tokenRange, context);
  const afterName = firstComma + 1;
  const secondComma = findTopLevelComma(context.source, afterName, innerEnd);
  const kindEnd = secondComma === undefined ? innerEnd : secondComma;
  const kind = context.source.slice(afterName, kindEnd).trim();
  const bodyStart = secondComma === undefined ? innerEnd : secondComma + 1;
  if (kind === 'plural') {
    return buildPluralNode(
      {
        bodyEnd: innerEnd,
        bodyStart,
        name,
        pluralKind: 'cardinal',
        tokenRange,
      },
      context,
    );
  }
  if (kind === 'selectordinal') {
    return buildPluralNode(
      {
        bodyEnd: innerEnd,
        bodyStart,
        name,
        pluralKind: 'ordinal',
        tokenRange,
      },
      context,
    );
  }
  if (kind === 'select') {
    return buildSelectNode(
      {
        bodyEnd: innerEnd,
        bodyStart,
        isInPluralBranch,
        name,
        tokenRange,
      },
      context,
    );
  }
  const bodyRange = getTrimmedRange(context.source, bodyStart, innerEnd);
  if (kind === 'number') {
    return buildNumberNode(
      {
        bodyRange,
        name,
      },
      context,
    );
  }
  if (kind === 'date') {
    return buildDateNode(
      {
        bodyRange,
        name,
      },
      context,
    );
  }
  if (kind === 'time') {
    return buildTimeNode(
      {
        bodyRange,
        name,
      },
      context,
    );
  }
  context.diagnostics.push({
    kind: 'malformed',
    message: `unknown argument type "${kind}"`,
    range: getTrimmedRange(context.source, afterName, kindEnd),
  });
  return {
    kind: 'placeholder',
    name,
  };
}

function emitNameDiagnostic(
  name: string,
  tokenRange: TemplateRange,
  context: ParseContext,
): void {
  if (name === '') {
    context.diagnostics.push({
      kind: 'malformed',
      message: 'empty argument',
      range: tokenRange,
    });
    return;
  }
  if (name.includes('{') || name.includes('}')) {
    context.diagnostics.push({
      kind: 'malformed',
      message: `placeholder name contains an unbalanced brace: "${name}"`,
      range: tokenRange,
    });
  }
}

type BuildPluralNodeInput = {
  bodyEnd: number;
  bodyStart: number;
  name: string;
  tokenRange: TemplateRange;
  pluralKind: 'cardinal' | 'ordinal';
};

function buildPluralNode(
  input: BuildPluralNodeInput,
  context: ParseContext,
): PluralNode {
  const bodyText = context.source.slice(input.bodyStart, input.bodyEnd);
  const firstBrace = bodyText.indexOf('{');
  const preludeEnd = firstBrace === -1 ? bodyText.length : firstBrace;
  const offsetMatch = PLURAL_OFFSET_RX.exec(bodyText.slice(0, preludeEnd));
  if (offsetMatch) {
    context.diagnostics.push({
      feature: 'plural offset',
      kind: 'unsupported',
      name: input.name,
      range: {
        end: input.bodyStart + offsetMatch.index + offsetMatch[0].length,
        start: input.bodyStart + offsetMatch.index,
      },
    });
  }
  const branchesStart = offsetMatch
    ? input.bodyStart + offsetMatch.index + offsetMatch[0].length
    : input.bodyStart;
  const branches = parseBranches(context, branchesStart, input.bodyEnd, true);
  if (!('other' in branches)) {
    context.diagnostics.push({
      kind: 'missing-other',
      name: input.name,
      range: input.tokenRange,
    });
  }
  for (const branch of Object.keys(branches)) {
    if (KNOWN_PLURAL_KEYWORDS.has(branch) || EXACT_MATCH_RX.test(branch)) {
      continue;
    }
    context.diagnostics.push({
      branch,
      kind: 'unknown-keyword',
      name: input.name,
      pluralKind: input.pluralKind,
      range: input.tokenRange,
    });
  }
  return {
    branches,
    kind: 'plural',
    name: input.name,
    pluralKind: input.pluralKind,
  };
}

type BuildSelectNodeInput = {
  bodyEnd: number;
  bodyStart: number;
  isInPluralBranch: boolean;
  name: string;
  tokenRange: TemplateRange;
};

function buildSelectNode(
  input: BuildSelectNodeInput,
  context: ParseContext,
): SelectNode {
  const branches = parseBranches(
    context,
    input.bodyStart,
    input.bodyEnd,
    input.isInPluralBranch,
  );
  if (!('other' in branches)) {
    context.diagnostics.push({
      kind: 'missing-other',
      name: input.name,
      range: input.tokenRange,
    });
  }
  return {
    branches,
    kind: 'select',
    name: input.name,
  };
}

type BuildFormatNodeInput = {
  bodyRange: TemplateRange;
  name: string;
};

function buildNumberNode(
  input: BuildFormatNodeInput,
  context: ParseContext,
): NumberNode {
  return {
    kind: 'number',
    name: input.name,
    options: resolveNumberOptions(input, context),
  };
}

function buildDateNode(
  input: BuildFormatNodeInput,
  context: ParseContext,
): DateNode {
  return {
    kind: 'date',
    name: input.name,
    style: resolveDateTimeStyle(input, context, 'date'),
  };
}

function buildTimeNode(
  input: BuildFormatNodeInput,
  context: ParseContext,
): TimeNode {
  return {
    kind: 'time',
    name: input.name,
    style: resolveDateTimeStyle(input, context, 'time'),
  };
}

function parseBranches(
  context: ParseContext,
  start: number,
  end: number,
  isInPluralBranch: boolean,
): Record<string, Template> {
  const branches: Record<string, Template> = Object.create(null);
  let position = start;
  while (position < end) {
    while (position < end && isWhitespace(context.source[position])) {
      position++;
    }
    if (position >= end) {
      break;
    }
    const nameStart = position;
    let nameEnd = position;
    while (
      nameEnd < end &&
      !isWhitespace(context.source[nameEnd]) &&
      context.source[nameEnd] !== '{'
    ) {
      nameEnd++;
    }
    const branchName = context.source.slice(nameStart, nameEnd);
    position = nameEnd;
    while (position < end && isWhitespace(context.source[position])) {
      position++;
    }
    if (context.source[position] !== '{') {
      context.diagnostics.push({
        kind: 'malformed',
        message: `branch "${branchName}" at index ${nameStart}: missing '{' after branch name`,
        range: {
          end: nameEnd,
          start: nameStart,
        },
      });
      continue;
    }
    if (branchName === '') {
      context.diagnostics.push({
        kind: 'malformed',
        message: `branch at index ${position}: missing name before '{'`,
        range: {
          end: position + 1,
          start: position,
        },
      });
    }
    const closeIndex = findMatchingBrace(context.source, position);
    if (closeIndex === undefined) {
      context.diagnostics.push({
        kind: 'malformed',
        message: `unbalanced '{' at index ${position}: missing closing '}'`,
        range: {
          end: context.source.length,
          start: position,
        },
      });
      break;
    }
    const inner = parseNodes(context, position + 1, isInPluralBranch, '}');
    if (branchName !== '') {
      branches[branchName] = inner.value;
    }
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

function getTrimmedRange(
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
    return {
      end,
      start,
    };
  }
  return {
    end: trimmedEnd,
    start: trimmedStart,
  };
}

function resolveNumberOptions(
  input: BuildFormatNodeInput,
  context: ParseContext,
): Intl.NumberFormatOptions {
  const body = context.source
    .slice(input.bodyRange.start, input.bodyRange.end)
    .trim();
  if (body === '' || body === 'decimal') {
    return {};
  }
  if (body === 'percent') {
    return {
      style: 'percent',
    };
  }
  if (body === 'integer') {
    return {
      maximumFractionDigits: 0,
    };
  }
  if (body === 'currency') {
    context.diagnostics.push({
      feature: 'currency without a code',
      kind: 'unsupported',
      name: input.name,
      range: input.bodyRange,
    });
    return {};
  }
  if (body.startsWith('currency')) {
    const currencyCode = body.slice('currency'.length).trim();
    if (currencyCode !== '') {
      if (!isCurrency(currencyCode)) {
        context.diagnostics.push({
          kind: 'malformed',
          message: `Unsupported currency code "${currencyCode}".`,
          range: input.bodyRange,
        });
        return {};
      }
      return {
        currency: currencyCode,
        style: 'currency',
      };
    }
  }
  if (body.startsWith('::')) {
    context.diagnostics.push({
      feature: 'number skeleton',
      kind: 'unsupported',
      name: input.name,
      range: input.bodyRange,
    });
    return {};
  }
  context.diagnostics.push({
    feature: `number style "${body}"`,
    kind: 'unsupported',
    name: input.name,
    range: input.bodyRange,
  });
  return {};
}

function resolveDateTimeStyle(
  input: BuildFormatNodeInput,
  context: ParseContext,
  kind: 'date' | 'time',
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
    kind: 'unsupported',
    name: input.name,
    range: input.bodyRange,
  });
  return 'medium';
}
