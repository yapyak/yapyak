import type { JSDocParameterTag, Node, ParameterDeclaration } from 'typescript';

import ts from 'typescript';

import type { ReferenceParameter } from './type';
import { buildTypeTokens } from './type-token';

export function extractParameters(
  node: Node,
  parameters: readonly ParameterDeclaration[],
): ReferenceParameter[] {
  const paramTags = collectParamTags(node);
  const result: ReferenceParameter[] = [];
  for (const parameter of parameters) {
    const name = parameter.name.getText();
    const tag = paramTags.get(name);
    result.push({
      defaultValue: parameter.initializer?.getText() ?? null,
      description: readTagComment(tag),
      name,
      optional:
        parameter.questionToken !== undefined ||
        parameter.initializer !== undefined,
      shape: '',
      type: buildTypeTokens(parameter.type),
    });
  }
  return result;
}

function collectParamTags(node: Node): Map<string, JSDocParameterTag> {
  const tags = new Map<string, JSDocParameterTag>();
  for (const docTag of ts.getJSDocTags(node)) {
    if (ts.isJSDocParameterTag(docTag)) {
      tags.set(docTag.name.getText(), docTag);
    }
  }
  return tags;
}

function readTagComment(tag: JSDocParameterTag | undefined): string {
  if (tag?.comment === undefined) {
    return '';
  }
  if (typeof tag.comment === 'string') {
    return tag.comment.replace(/^[\s-]+/, '');
  }
  return tag.comment
    .map((part) => part.text ?? '')
    .join('')
    .replace(/^[\s-]+/, '');
}
