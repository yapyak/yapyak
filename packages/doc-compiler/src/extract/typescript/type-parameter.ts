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
  for (const tag of ts.getJSDocTags(parent)) {
    if (ts.isJSDocTemplateTag(tag)) {
      for (const declared of tag.typeParameters) {
        if (declared.name.text === node.name.text) {
          return getCommentText(tag.comment);
        }
      }
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
