import type { JSDoc, JSDocComment, Node } from 'typescript';

import ts from 'typescript';

import type { ReferenceExample, ReferenceTag, ReferenceThrows } from './type';

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

const EMPTY: ExtractJsDocResult = {
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
    return EMPTY;
  }

  const description = readComment(jsDoc.comment);
  const examples: ReferenceExample[] = [];
  const throws: ReferenceThrows[] = [];
  const seeAlso: string[] = [];
  const tags: ReferenceTag[] = [];
  let remarks = '';
  let shape = '';
  let deprecated: string | null = null;

  for (const tag of jsDoc.tags ?? []) {
    const name = tag.tagName.text;
    const text = readComment(tag.comment);
    if (name === 'example') {
      examples.push(parseExample(text));
      continue;
    }
    if (name === 'throws') {
      throws.push(parseThrows(tag, text));
      continue;
    }
    if (name === 'see') {
      const seeTarget = ts.isJSDocSeeTag(tag) ? tag.name?.getText() ?? '' : '';
      seeAlso.push(seeTarget !== '' ? seeTarget : text);
      continue;
    }
    if (name === 'remarks') {
      remarks = text;
      continue;
    }
    if (name === 'shape') {
      shape = text;
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

function readComment(
  comment: string | readonly JSDocComment[] | undefined,
): string {
  if (comment === undefined) {
    return '';
  }
  if (typeof comment === 'string') {
    return comment;
  }
  return comment.map(readJsDocComment).join('');
}

function readJsDocComment(part: JSDocComment): string {
  if (part.text !== undefined && part.text !== '') {
    return part.text;
  }
  if (ts.isJSDocLink(part) || ts.isJSDocLinkCode(part) || ts.isJSDocLinkPlain(part)) {
    return part.name?.getText() ?? '';
  }
  return '';
}

const EXAMPLE_FENCE_RX = /```(\S*)(?:\s+\[([^\]]+)\])?\n([\s\S]*?)```/;

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

function parseThrows(
  tag: ts.JSDocTag,
  text: string,
): ReferenceThrows {
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
