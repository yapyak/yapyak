import type {
  ApiExport,
  ApiMember,
  ApiOverload,
  ApiParameter,
  ApiTypeAlias,
  ApiTypeParameter,
  ApiVariable,
  TypeToken,
} from './types';
import type { Block, Page, TableRowBlock } from '#lib/content';

import { parseContent, slugify } from '#lib/content';

import { moduleSlug } from './sidebar.server';

export function buildSymbolPage(symbol: ApiExport, moduleId: string): Page {
  const blocks: Block[] = [];

  blocks.push(eyebrow(moduleId, symbol.kind));

  if (symbol.deprecated !== null) {
    blocks.push({
      children: [
        {
          children: [{ type: 'text', value: symbol.deprecated }],
          type: 'paragraph',
        },
      ],
      title: 'Deprecated',
      type: 'callout',
      variant: 'warning',
    });
  }

  if (symbol.description) {
    const parsed = parseContent(symbol.description);
    blocks.push(...parsed.blocks);
  }

  if (symbol.kind === 'function') {
    blocks.push(heading2('Signature'));
    blocks.push(functionSignatureBlock(symbol.overloads));
    const typeParameters = unifyTypeParameters(symbol.overloads);
    if (typeParameters.length > 0) {
      blocks.push(heading2('Type Parameters'));
      blocks.push(typeParametersTable(typeParameters));
    }
    const parameters = unifyParameters(symbol.overloads);
    if (parameters.length > 0) {
      blocks.push(heading2('Parameters'));
      blocks.push(parametersTable(parameters));
    }
    const returnType = symbol.overloads[0]?.returnType;
    if (returnType && (!isVoidTokens(returnType) || symbol.returnDescription)) {
      blocks.push(heading2('Returns'));
      blocks.push(returnsParagraph(returnType, symbol.returnDescription));
    }
    if (symbol.members.length > 0) {
      blocks.push(heading2('Members'));
      blocks.push(membersTable(symbol.members));
    }
  }

  if (symbol.kind === 'variable') {
    blocks.push(heading2('Signature'));
    blocks.push(variableSignatureBlock(symbol));
    if (symbol.members.length > 0) {
      blocks.push(heading2('Members'));
      blocks.push(membersTable(symbol.members));
    }
  }

  if (symbol.kind === 'interface') {
    if (symbol.members.length > 0) {
      blocks.push(heading2('Members'));
      blocks.push(membersTable(symbol.members));
    }
  }

  if (symbol.kind === 'type' && symbol.resolvedType.length > 0) {
    blocks.push(heading2('Type'));
    blocks.push(typeAliasBlock(symbol));
  }

  if (symbol.kind === 'class') {
    if (symbol.members.length > 0) {
      blocks.push(heading2('Members'));
      blocks.push(membersTable(symbol.members));
    }
  }

  if (symbol.examples.length > 0) {
    blocks.push(heading2('Examples'));
    for (const example of symbol.examples) {
      blocks.push(...parseContent(example).blocks);
    }
  }

  blocks.push({
    file: symbol.location.file,
    href: null,
    line: symbol.location.line,
    type: 'code-location',
  });

  return {
    blocks,
    description: '',
    title: symbol.kind === 'function' ? `${symbol.name}()` : symbol.name,
  };
}

function functionSignatureBlock(overloads: ApiOverload[]): Block {
  return {
    label: null,
    language: 'ts',
    source: overloads.map((overload) => overload.signature).join('\n'),
    type: 'code-block',
  };
}

function variableSignatureBlock(symbol: ApiVariable): Block {
  return {
    label: null,
    language: 'ts',
    source: symbol.signature,
    type: 'code-block',
  };
}

function typeAliasBlock(symbol: ApiTypeAlias): Block {
  return {
    label: null,
    language: 'ts',
    source: symbol.resolvedType.map((token) => token.text).join(''),
    type: 'code-block',
  };
}

function unifyParameters(overloads: ApiOverload[]): ApiParameter[] {
  if (overloads.length === 0) {
    return [];
  }
  const maxLength = Math.max(
    ...overloads.map((overload) => overload.parameters.length),
  );
  const unified: ApiParameter[] = [];
  for (let position = 0; position < maxLength; position++) {
    const present = overloads.filter(
      (overload) => overload.parameters[position] !== undefined,
    );
    const first = present[0]?.parameters[position];
    if (first === undefined) {
      continue;
    }
    const inAll = present.length === overloads.length;
    unified.push({ ...first, optional: !inAll || first.optional });
  }
  return unified;
}

function eyebrow(moduleId: string, kind: string): Block {
  return { text: `${moduleId} · ${kind}`, type: 'eyebrow' };
}

function heading2(text: string): Block {
  return {
    children: [{ type: 'text', value: text }],
    id: slugify(text),
    level: 2,
    type: 'heading',
  };
}

function unifyTypeParameters(overloads: ApiOverload[]): ApiTypeParameter[] {
  const seen = new Set<string>();
  const unified: ApiTypeParameter[] = [];
  for (const overload of overloads) {
    for (const typeParameter of overload.typeParameters) {
      if (seen.has(typeParameter.name)) {
        continue;
      }
      seen.add(typeParameter.name);
      unified.push(typeParameter);
    }
  }
  return unified;
}

function typeParametersTable(typeParameters: ApiTypeParameter[]): Block {
  return {
    body: typeParameters.map((typeParameter) => typeParameterRow(typeParameter)),
    head: tableHeaderRow(['Name', 'Constraint', 'Default']),
    type: 'table',
  };
}

function typeParameterRow(typeParameter: ApiTypeParameter): TableRowBlock {
  return {
    children: [
      bodyCell([{ type: 'inline-code', value: typeParameter.name }]),
      bodyCell(
        typeParameter.constraint !== null
          ? tokensToBlocks(typeParameter.constraint)
          : [{ type: 'text', value: '' }],
      ),
      bodyCell(
        typeParameter.defaultType !== null
          ? tokensToBlocks(typeParameter.defaultType)
          : [{ type: 'text', value: '' }],
      ),
    ],
    type: 'table-row',
  };
}

function parametersTable(parameters: ApiParameter[]): Block {
  return {
    body: parameters.map((parameter) => paramRow(parameter)),
    head: tableHeaderRow(['Name', 'Type', 'Description']),
    type: 'table',
  };
}

function membersTable(members: ApiMember[]): Block {
  return {
    body: members.map((member) => memberRow(member)),
    head: tableHeaderRow(['Name', 'Type', 'Description']),
    type: 'table',
  };
}

function paramRow(parameter: ApiParameter): TableRowBlock {
  return {
    children: [
      bodyCell([
        {
          type: 'inline-code',
          value: parameter.name + (parameter.optional ? '?' : ''),
        },
      ]),
      bodyCell(tokensToBlocks(parameter.type)),
      bodyCell([{ type: 'text', value: parameter.description }]),
    ],
    type: 'table-row',
  };
}

function memberRow(member: ApiMember): TableRowBlock {
  return {
    children: [
      bodyCell([
        {
          type: 'inline-code',
          value: member.name + (member.optional ? '?' : ''),
        },
      ]),
      bodyCell(tokensToBlocks(member.type)),
      bodyCell([{ type: 'text', value: member.description }]),
    ],
    type: 'table-row',
  };
}

function bodyCell(children: Block[]) {
  return { children, header: false, type: 'table-cell' as const };
}

function tableHeaderRow(labels: string[]): TableRowBlock {
  return {
    children: labels.map((label) => ({
      children: [{ type: 'text' as const, value: label }],
      header: true,
      type: 'table-cell' as const,
    })),
    type: 'table-row',
  };
}

function returnsParagraph(
  returnType: TypeToken[],
  returnDescription: string,
): Block {
  const children: Block[] = tokensToBlocks(returnType);
  if (returnDescription) {
    children.push({ type: 'text', value: ` — ${returnDescription}` });
  }
  return { children, type: 'paragraph' };
}

function tokensToBlocks(tokens: TypeToken[]): Block[] {
  const blocks: Block[] = [];
  for (const token of tokens) {
    if (token.kind === 'ref') {
      blocks.push({
        children: [{ type: 'inline-code', value: token.text }],
        href: symbolHref(token.module, token.name),
        kind: 'internal',
        type: 'link',
      });
    } else {
      blocks.push({ type: 'inline-code', value: token.text });
    }
  }
  if (blocks.length === 0) {
    blocks.push({ type: 'inline-code', value: '' });
  }
  return blocks;
}

function isVoidTokens(tokens: TypeToken[]) {
  return (
    tokens.length === 1 && tokens[0]?.kind === 'text' && tokens[0].text === 'void'
  );
}

function symbolHref(moduleId: string, name: string) {
  const slug = moduleSlug(moduleId);
  return slug === 'yapyak' ? `/reference/${name}` : `/reference/${slug}/${name}`;
}
