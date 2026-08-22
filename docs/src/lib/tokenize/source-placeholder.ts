import type {
  TemplateToken,
  TemplateTokenKind,
} from 'yapyak/template/internal';
import type { SlotPosition, Token, TokenKind } from './type';

import { tokenizeTemplate } from 'yapyak/template/internal';

const KIND_BY_TEMPLATE_KIND: Record<TemplateTokenKind, TokenKind> = {
  branch: 'icu-branch',
  keyword: 'icu-keyword',
  placeholder: 'icu-placeholder',
  pound: 'icu-pound',
  punctuation: 'icu-punctuation',
  slot: 't-source',
  tag: 'icu-tag',
  text: 't-source',
};

export function expandSourcePlaceholders(tokens: Token[]) {
  const result: Token[] = [];
  for (const token of tokens) {
    if (
      token.kind !== 't-source' ||
      (!token.value.includes('{') && !token.value.includes('<'))
    ) {
      result.push(token);
      continue;
    }
    expandSingleSource(token.value, result);
  }
  return result;
}

function expandSingleSource(value: string, output: Token[]): void {
  const firstCharacter = value.charAt(0);
  const lastCharacter = value.charAt(value.length - 1);
  const isQuoted =
    (firstCharacter === "'" ||
      firstCharacter === '"' ||
      firstCharacter === '`') &&
    firstCharacter === lastCharacter &&
    value.length >= 2;

  if (!isQuoted) {
    expandTemplate(value, output);
    return;
  }

  output.push({
    kind: 't-source',
    value: firstCharacter,
  });
  expandTemplate(value.slice(1, -1), output);
  output.push({
    kind: 't-source',
    value: lastCharacter,
  });
}

function expandTemplate(text: string, output: Token[]): void {
  if (text.length === 0) {
    return;
  }

  const tokens = tokenizeTemplate(text);
  const slots = tokens.filter((token) => token.kind === 'slot');
  const spans = tokens
    .filter((token) => token.kind !== 'slot')
    .sort((left, right) => left.offset - right.offset);

  let cursor = 0;
  for (const span of spans) {
    const end = span.offset + span.length;
    if (end <= cursor) {
      continue;
    }
    if (span.offset > cursor) {
      pushSpan(text, cursor, span.offset, 't-source', slots, output);
    }
    pushSpan(
      text,
      Math.max(cursor, span.offset),
      end,
      KIND_BY_TEMPLATE_KIND[span.kind],
      slots,
      output,
    );
    cursor = end;
  }
  if (cursor < text.length) {
    pushSpan(text, cursor, text.length, 't-source', slots, output);
  }
}

function pushSpan(
  text: string,
  start: number,
  end: number,
  kind: TokenKind,
  slots: TemplateToken[],
  output: Token[],
): void {
  const value = text.slice(start, end);
  if (value.length === 0) {
    return;
  }
  const slot = slots.find(
    (candidate) =>
      start >= candidate.offset && end <= candidate.offset + candidate.length,
  );
  if (slot === undefined) {
    output.push({
      kind,
      value,
    });
    return;
  }
  output.push({
    kind,
    slot: slotPosition(start, end, slot),
    value,
  });
}

function slotPosition(
  start: number,
  end: number,
  slot: TemplateToken,
): SlotPosition {
  const isStart = start === slot.offset;
  const isEnd = end === slot.offset + slot.length;
  if (isStart && isEnd) {
    return 'only';
  }
  if (isStart) {
    return 'start';
  }
  if (isEnd) {
    return 'end';
  }
  return 'middle';
}
