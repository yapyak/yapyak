import type { NodeArray, TypeParameterDeclaration } from 'typescript';
import type { ReferenceTypeParameter } from './type';

import ts from 'typescript';

import { buildTypeTokens } from './type-token';

export function extractTypeParameters(
  typeParameters: NodeArray<TypeParameterDeclaration> | undefined,
): ReferenceTypeParameter[] {
  if (typeParameters === undefined || typeParameters.length === 0) {
    return [];
  }
  return typeParameters.map((typeParameter) => ({
    constraint:
      typeParameter.constraint === undefined
        ? null
        : buildTypeTokens(typeParameter.constraint),
    defaultType:
      typeParameter.default === undefined
        ? null
        : buildTypeTokens(typeParameter.default),
    description: getTypeParameterDescription(typeParameter),
    name: typeParameter.name.text,
  }));
}

function getTypeParameterDescription(node: TypeParameterDeclaration): string {
  const parent = node.parent;
  if (parent === undefined) {
    return '';
  }
  const targetName = node.name.text;
  for (const tag of ts.getJSDocTags(parent)) {
    if (ts.isJSDocTemplateTag(tag)) {
      for (const declared of tag.typeParameters) {
        if (declared.name.text === targetName) {
          return getCommentText(tag.comment);
        }
      }
      continue;
    }
    if (tag.tagName.text !== 'typeParam') {
      continue;
    }
    const text = getCommentText(tag.comment);
    const match = /^([A-Za-z_$][\w$]*)\s*-?\s*(.*)$/s.exec(text);
    if (match === null) {
      continue;
    }
    if (match[1] === targetName) {
      return match[2] ?? '';
    }
  }
  return '';
}

function getCommentText(
  comment:
    | string
    | readonly {
        text?: string;
      }[]
    | undefined,
): string {
  if (comment === undefined) {
    return '';
  }
  const raw =
    typeof comment === 'string'
      ? comment
      : comment.map((part) => part.text ?? '').join('');
  return raw.replace(/^[\s-]+/, '');
}
