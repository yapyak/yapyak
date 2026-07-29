import type {
  MethodSignature,
  NodeArray,
  PropertySignature,
  TypeElement,
} from '@typescript/typescript6';
import type {
  ReferenceMember,
  ReferenceMethodMember,
  ReferenceOverload,
  ReferencePropertyMember,
  ReferenceTag,
} from './type';

import ts from '@typescript/typescript6';

import { extractJsDoc } from './jsdoc';
import { buildLocation } from './location';
import { buildMethodOverload } from './signature';
import { buildTypeTokens } from './type-token';

export type ExtractMembersContext = {
  packageDir: string;
};

export function extractMembers(
  members: NodeArray<TypeElement>,
  context: ExtractMembersContext,
): ReferenceMember[] {
  const result: ReferenceMember[] = [];
  let pendingName: string | undefined;
  let pendingFirstNode: MethodSignature | undefined;
  let pendingOverloads: ReferenceOverload[] = [];

  const flushPending = () => {
    if (pendingFirstNode === undefined || pendingName === undefined) {
      return;
    }
    result.push(
      buildMethodMember(
        pendingName,
        pendingFirstNode,
        pendingOverloads,
        context,
      ),
    );
    pendingName = undefined;
    pendingFirstNode = undefined;
    pendingOverloads = [];
  };

  for (const member of members) {
    if (ts.isMethodSignature(member) && member.name !== undefined) {
      const name = member.name.getText();
      if (pendingName === name) {
        pendingOverloads.push(buildMethodOverload(member));
        continue;
      }
      flushPending();
      pendingName = name;
      pendingFirstNode = member;
      pendingOverloads = [
        buildMethodOverload(member),
      ];
      continue;
    }

    flushPending();

    if (ts.isPropertySignature(member) && member.name !== undefined) {
      result.push(buildPropertyMember(member));
    }
  }

  flushPending();

  return result;
}

function buildPropertyMember(node: PropertySignature): ReferencePropertyMember {
  const jsDoc = extractJsDoc(node);
  return {
    defaultValue: parseDefaultValue(jsDoc.tags),
    description: jsDoc.description,
    kind: 'property',
    name: node.name.getText(),
    optional: node.questionToken !== undefined,
    type: buildTypeTokens(node.type),
  };
}

function buildMethodMember(
  name: string,
  firstNode: MethodSignature,
  overloads: ReferenceOverload[],
  context: ExtractMembersContext,
): ReferenceMethodMember {
  const jsDoc = extractJsDoc(firstNode);
  const sourceFile = firstNode.getSourceFile();
  return {
    deprecated: jsDoc.deprecated,
    description: jsDoc.description,
    examples: jsDoc.examples,
    kind: 'method',
    location: buildLocation(firstNode, sourceFile, context.packageDir),
    name,
    optional: firstNode.questionToken !== undefined,
    overloads,
    remarks: jsDoc.remarks,
    seeAlso: jsDoc.seeAlso,
    shape: jsDoc.shape,
    tags: jsDoc.tags,
    throws: jsDoc.throws,
  };
}

function parseDefaultValue(tags: ReferenceTag[]): string | null {
  for (const tag of tags) {
    if (tag.name === 'defaultValue') {
      return tag.text.trim();
    }
  }
  return null;
}
