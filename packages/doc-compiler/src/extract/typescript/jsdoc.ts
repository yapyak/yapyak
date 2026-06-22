import type { JSDoc, JSDocComment, Node } from 'typescript';
import type { ReferenceExample, ReferenceTag, ReferenceThrows } from './type';

import ts from 'typescript';

export type ExtractJsDocResult = {
  deprecated: string | null;
  description: string;
  examples: ReferenceExample[];
  remarks: string;
  seeAlso: string[];
  shape: string;
  tags: ReferenceTag[];
  throws: ReferenceThrows[];
};

const EMPTY_RESULT: ExtractJsDocResult = {
  deprecated: null,
  description: '',
  examples: [],
  remarks: '',
  seeAlso: [],
  shape: '',
  tags: [],
  throws: [],
};

export function extractJsDoc(node: Node): ExtractJsDocResult {
  const jsDoc = findLastJsDoc(node);
  if (jsDoc === undefined) {
    return EMPTY_RESULT;
  }

  let description = getCommentText(jsDoc.comment);
  const examples: ReferenceExample[] = [];
  const throws: ReferenceThrows[] = [];
  const seeAlso: string[] = [];
  const tags: ReferenceTag[] = [];
  let remarks = '';
  let shape = '';
  let deprecated: string | null = null;

  for (const tag of jsDoc.tags ?? []) {
    const name = tag.tagName.text;
    const text = getCommentText(tag.comment);
    if (text.startsWith('/')) {
      const needsSpace = description.length > 0 && !/\s$/.test(description);
      description += `${needsSpace ? ' ' : ''}@${name}${text}`;
      continue;
    }
    if (name === 'example') {
      examples.push(parseExample(readExampleSource(tag)));
      continue;
    }
    if (name === 'throws') {
      throws.push(parseThrows(tag, text));
      continue;
    }
    if (name === 'see') {
      seeAlso.push(parseSeeTarget(tag, text));
      continue;
    }
    if (name === 'remarks') {
      remarks = text;
      continue;
    }
    if (name === 'shape') {
      shape = unescapeBraces(extractRawTagText(tag, name));
      continue;
    }
    if (name === 'deprecated') {
      deprecated = text;
      continue;
    }
    tags.push({
      name,
      text,
    });
  }

  return {
    deprecated,
    description,
    examples,
    remarks,
    seeAlso,
    shape,
    tags,
    throws,
  };
}

function parseSeeTarget(tag: ts.JSDocTag, text: string): string {
  if (!ts.isJSDocSeeTag(tag)) {
    return text;
  }
  const tagName = tag.name?.getText() ?? '';
  if (tagName === '') {
    return text;
  }
  if (text.startsWith('://')) {
    return `${tagName}${text}`;
  }
  return tagName;
}

function findLastJsDoc(node: Node): JSDoc | undefined {
  const comments = ts.getJSDocCommentsAndTags(node);
  for (let index = comments.length - 1; index >= 0; index--) {
    const candidate = comments[index];
    if (candidate !== undefined && ts.isJSDoc(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

export function getCommentText(
  comment: string | readonly JSDocComment[] | undefined,
): string {
  if (comment === undefined) {
    return '';
  }
  if (typeof comment === 'string') {
    return comment;
  }
  return comment.map(getCommentPart).join('');
}

function getCommentPart(part: JSDocComment): string {
  if (part.text !== undefined && part.text !== '') {
    return part.text;
  }
  if (
    ts.isJSDocLink(part) ||
    ts.isJSDocLinkCode(part) ||
    ts.isJSDocLinkPlain(part)
  ) {
    return part.name?.getText() ?? '';
  }
  return '';
}

const EXAMPLE_FENCE_RX = /```(\S*)(?:\s+\[([^\]]+)\])?\n([\s\S]*?)```/;

const EXAMPLE_TAG_PREFIX_RX = /^@example[ \t]?/;
const JSDOC_LINE_PREFIX_RX = /^[ \t]*\*[ \t]?/;

function readExampleSource(tag: ts.JSDocTag): string {
  const raw = tag.getText().replace(EXAMPLE_TAG_PREFIX_RX, '');
  const lines = raw.split('\n');
  const cleaned = lines.map((line, index) =>
    index === 0 ? line : line.replace(JSDOC_LINE_PREFIX_RX, ''),
  );
  return cleaned.join('\n').trimEnd();
}

function parseExample(text: string): ReferenceExample {
  const trimmed = text.trim();
  const fence = trimmed.match(EXAMPLE_FENCE_RX);
  if (fence === null) {
    return {
      code: trimmed,
      language: '',
      path: null,
      title: null,
    };
  }
  const before = trimmed.slice(0, fence.index).trim();
  return {
    code: (fence[3] ?? '').trim(),
    language: fence[1] ?? '',
    path: fence[2] ?? null,
    title: before === '' ? null : before,
  };
}

function parseThrows(tag: ts.JSDocTag, text: string): ReferenceThrows {
  if (ts.isJSDocThrowsTag(tag) && tag.typeExpression !== undefined) {
    return {
      condition: text.trim(),
      errorClass: tag.typeExpression.type.getText(),
    };
  }
  return {
    condition: text.trim(),
    errorClass: 'Error',
  };
}

function unescapeBraces(text: string): string {
  return text.replace(/\\([{}])/g, '$1');
}

function extractRawTagText(
  tag: {
    getText(): string;
  },
  name: string,
): string {
  const raw = tag.getText();
  const withoutTagName = raw.replace(new RegExp(`^@${name}\\s*`), '');
  const lines = withoutTagName.split('\n');
  const result: string[] = [];
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index] ?? '';
    if (index === 0) {
      result.push(line);
      continue;
    }
    result.push(line.replace(/^\s*\*\s?/, ''));
  }
  return result.join('\n').trimEnd();
}
