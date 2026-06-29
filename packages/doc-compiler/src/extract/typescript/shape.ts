import type { ReferenceTag, ReferenceTypeParameter, TypeToken } from './type';

import ts from 'typescript';

import { buildTypeTokens } from './type-token';

export function parseShapeTypeParameters(
  shape: string,
  tags: ReferenceTag[],
): ReferenceTypeParameter[] {
  const angleContent = extractTypeParameterContent(shape);
  if (angleContent === undefined) {
    return [];
  }
  const segments = splitAtDepthZero(angleContent);
  const descriptionByName = collectTypeParamDescriptions(tags);
  return segments.map((segment) =>
    parseTypeParameterSegment(segment, descriptionByName),
  );
}

function extractTypeParameterContent(shape: string): string | undefined {
  const angleStart = shape.indexOf('<');
  if (angleStart === -1) {
    return undefined;
  }
  let depth = 0;
  for (let index = angleStart; index < shape.length; index++) {
    const character = shape[index];
    if (character === '<') {
      depth++;
    } else if (character === '>') {
      depth--;
      if (depth === 0) {
        return shape.slice(angleStart + 1, index);
      }
    }
  }
  return undefined;
}

function splitAtDepthZero(content: string): string[] {
  const segments: string[] = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < content.length; index++) {
    const character = content[index];
    if (
      character === '<' ||
      character === '(' ||
      character === '[' ||
      character === '{'
    ) {
      depth++;
    } else if (
      character === '>' ||
      character === ')' ||
      character === ']' ||
      character === '}'
    ) {
      depth--;
    } else if (character === ',' && depth === 0) {
      segments.push(content.slice(start, index).trim());
      start = index + 1;
    }
  }
  const tail = content.slice(start).trim();
  if (tail.length > 0) {
    segments.push(tail);
  }
  return segments;
}

function parseTypeParameterSegment(
  segment: string,
  descriptionByName: Map<string, string>,
): ReferenceTypeParameter {
  const defaultMatch = /\s+=\s+(.+)$/s.exec(segment);
  const withoutDefault =
    defaultMatch === null ? segment : segment.slice(0, defaultMatch.index);
  const defaultText = defaultMatch?.[1]?.trim();

  const extendsMatch = /\s+extends\s+(.+)$/s.exec(withoutDefault);
  const name =
    extendsMatch === null
      ? withoutDefault.trim()
      : withoutDefault.slice(0, extendsMatch.index).trim();
  const constraintText = extendsMatch?.[1]?.trim();

  return {
    constraint:
      constraintText === undefined ? null : parseTypeText(constraintText),
    defaultType: defaultText === undefined ? null : parseTypeText(defaultText),
    description: descriptionByName.get(name) ?? '',
    name,
  };
}

function collectTypeParamDescriptions(
  tags: ReferenceTag[],
): Map<string, string> {
  const descriptionsByName = new Map<string, string>();
  for (const tag of tags) {
    if (tag.name !== 'typeParam') {
      continue;
    }
    const match = /^([A-Za-z_$][\w$]*)\s*-?\s*(.*)$/s.exec(tag.text);
    if (match === null || match[1] === undefined) {
      continue;
    }
    descriptionsByName.set(match[1], match[2]?.trim() ?? '');
  }
  return descriptionsByName;
}

function parseTypeText(text: string): TypeToken[] {
  const sourceFile = ts.createSourceFile(
    'shape.ts',
    `type _ = ${text};`,
    ts.ScriptTarget.Latest,
    true,
  );
  const declaration = sourceFile.statements.find(ts.isTypeAliasDeclaration);
  if (declaration === undefined) {
    return [
      {
        kind: 'text',
        text,
      },
    ];
  }
  return buildTypeTokens(declaration.type);
}
