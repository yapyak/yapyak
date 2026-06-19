import type { NodeArray, TypeParameterDeclaration } from 'typescript';

import ts from 'typescript';

import type { ReferenceTypeParameter } from './type';
import { buildTypeTokens } from './type-token';

export function extractTypeParameters(
  typeParameters: NodeArray<TypeParameterDeclaration> | undefined,
): ReferenceTypeParameter[] {
  if (typeParameters === undefined || typeParameters.length === 0) {
    return [];
  }
  return typeParameters.map((parameter) => ({
    constraint: parameter.constraint
      ? buildTypeTokens(parameter.constraint)
      : null,
    defaultType: parameter.default ? buildTypeTokens(parameter.default) : null,
    description: readTypeParamDescription(parameter),
    name: parameter.name.text,
  }));
}

function readTypeParamDescription(node: TypeParameterDeclaration): string {
  const parent = node.parent;
  if (parent === undefined) {
    return '';
  }
  for (const tag of ts.getJSDocTags(parent)) {
    if (ts.isJSDocTemplateTag(tag)) {
      for (const declared of tag.typeParameters) {
        if (declared.name.text === node.name.text) {
          return readCommentText(tag.comment);
        }
      }
    }
  }
  return '';
}

function readCommentText(
  comment: string | readonly { text?: string }[] | undefined,
): string {
  if (comment === undefined) {
    return '';
  }
  const raw = typeof comment === 'string'
    ? comment
    : comment.map((part) => part.text ?? '').join('');
  return raw.replace(/^[\s-]+/, '');
}
