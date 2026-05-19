import type {
  ApiExport,
  ApiFunction,
  ApiMember,
  ApiParameter,
  TypeToken,
} from './types';
import type { Block, Page, TableRowBlock } from '#lib/content';

import { parseContent, slugify } from '#lib/content';

import { moduleSlug } from './sidebar.server';

export function buildSymbolPage(
  symbol: ApiExport,
  moduleId: string,
): Page {
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

  blocks.push(heading2('Signature'));
  blocks.push({
    label: null,
    language: 'ts',
    source: symbol.signature,
    type: 'code-block',
  });

  if (symbol.kind === 'function') {
    if (symbol.parameters.length > 0) {
      blocks.push(heading2('Parameters'));
      blocks.push(parametersTable(symbol.parameters));
    }
    if (!isVoidTokens(symbol.returnType) || symbol.returnDescription) {
      blocks.push(heading2('Returns'));
      blocks.push(returnsParagraph(symbol));
    }
  }

  if (symbol.kind === 'interface' && symbol.members.length > 0) {
    blocks.push(heading2('Members'));
    blocks.push(membersTable(symbol.members));
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
    type: 'source-link',
  });

  return { blocks, description: '', title: symbol.name };
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
      {
        children: [
          {
            type: 'inline-code',
            value: parameter.name + (parameter.optional ? '?' : ''),
          },
        ],
        type: 'table-cell',
      },
      { children: tokensToBlocks(parameter.type), type: 'table-cell' },
      {
        children: [{ type: 'text', value: parameter.description }],
        type: 'table-cell',
      },
    ],
    type: 'table-row',
  };
}

function memberRow(member: ApiMember): TableRowBlock {
  return {
    children: [
      {
        children: [
          {
            type: 'inline-code',
            value: member.name + (member.optional ? '?' : ''),
          },
        ],
        type: 'table-cell',
      },
      { children: tokensToBlocks(member.type), type: 'table-cell' },
      {
        children: [{ type: 'text', value: member.description }],
        type: 'table-cell',
      },
    ],
    type: 'table-row',
  };
}

function tableHeaderRow(labels: string[]): TableRowBlock {
  return {
    children: labels.map((label) => ({
      children: [{ type: 'text' as const, value: label }],
      type: 'table-header-cell' as const,
    })),
    type: 'table-row',
  };
}

function returnsParagraph(symbol: ApiFunction): Block {
  const children: Block[] = tokensToBlocks(symbol.returnType);
  if (symbol.returnDescription) {
    children.push({ type: 'text', value: ` — ${symbol.returnDescription}` });
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
