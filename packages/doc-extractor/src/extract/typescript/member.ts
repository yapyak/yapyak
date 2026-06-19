import type { NodeArray, TypeElement } from 'typescript';

import ts from 'typescript';

import { extractJsDoc } from './jsdoc';
import type { ReferenceMember } from './type';
import { buildTypeTokens } from './type-token';

export function extractMembers(
  members: NodeArray<TypeElement>,
): ReferenceMember[] {
  const result: ReferenceMember[] = [];
  for (const member of members) {
    if (!ts.isPropertySignature(member) && !ts.isMethodSignature(member)) {
      continue;
    }
    if (member.name === undefined) {
      continue;
    }
    const jsDoc = extractJsDoc(member);
    result.push({
      defaultValue: parseDefaultValue(jsDoc.tags),
      description: jsDoc.description,
      name: member.name.getText(),
      optional: member.questionToken !== undefined,
      type: buildMemberType(member),
    });
  }
  return result;
}

function buildMemberType(member: TypeElement): ReturnType<typeof buildTypeTokens> {
  if (ts.isPropertySignature(member)) {
    return buildTypeTokens(member.type);
  }
  if (ts.isMethodSignature(member)) {
    const text = member.getText();
    const colonIndex = text.indexOf(':');
    if (colonIndex === -1) {
      return [];
    }
    return [
      {
        kind: 'text',
        text: text.slice(colonIndex + 1).trim().replace(/;$/, ''),
      },
    ];
  }
  return [];
}

function parseDefaultValue(
  tags: { name: string; text: string }[],
): string | null {
  for (const tag of tags) {
    if (tag.name === 'defaultValue') {
      return tag.text.trim();
    }
  }
  return null;
}
