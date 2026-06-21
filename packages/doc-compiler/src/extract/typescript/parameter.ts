import type {
  JSDocComment,
  JSDocParameterTag,
  Node,
  ParameterDeclaration,
} from 'typescript';
import type { ReferenceParameter } from './type';

import ts from 'typescript';

import { buildTypeTokens } from './type-token';

export function extractParameters(
  node: Node,
  parameters: readonly ParameterDeclaration[],
): ReferenceParameter[] {
  const parameterTags = extractParameterTags(node);
  const result: ReferenceParameter[] = [];
  for (const parameter of parameters) {
    const name = parameter.name.getText();
    const tag = parameterTags.get(name);
    const rawComment = getTagComment(tag);
    const { description, shape } = extractInlineShape(rawComment);
    result.push({
      defaultValue: parameter.initializer?.getText() ?? null,
      description,
      name,
      optional:
        parameter.questionToken !== undefined ||
        parameter.initializer !== undefined ||
        parameter.dotDotDotToken !== undefined,
      shape,
      type: buildTypeTokens(parameter.type),
    });
  }
  return result;
}

function extractInlineShape(comment: string): {
  description: string;
  shape: string;
} {
  const match = /^\s*\{@shape\s+([^}]+)\}\s*/.exec(comment);
  if (match === null || match[1] === undefined) {
    return {
      description: comment,
      shape: '',
    };
  }
  return {
    description: comment.slice(match[0].length).trimStart(),
    shape: match[1].trim(),
  };
}

function extractParameterTags(node: Node): Map<string, JSDocParameterTag> {
  const tags = new Map<string, JSDocParameterTag>();
  for (const docTag of ts.getJSDocTags(node)) {
    if (ts.isJSDocParameterTag(docTag)) {
      tags.set(docTag.name.getText(), docTag);
    }
  }
  return tags;
}

function getTagComment(tag: JSDocParameterTag | undefined): string {
  if (tag?.comment === undefined) {
    return '';
  }
  if (typeof tag.comment === 'string') {
    return tag.comment.replace(/^[\s-]+/, '');
  }
  return tag.comment
    .map(commentPartToText)
    .join('')
    .replace(/^[\s-]+/, '');
}

function commentPartToText(part: JSDocComment): string {
  if (
    ts.isJSDocLink(part) ||
    ts.isJSDocLinkCode(part) ||
    ts.isJSDocLinkPlain(part)
  ) {
    const linkName = part.name?.getText() ?? '';
    const tail = part.text ?? '';
    if (tail.startsWith('|')) {
      return tail.slice(1).trim();
    }
    return `${linkName}${tail}`;
  }
  return part.text ?? '';
}
