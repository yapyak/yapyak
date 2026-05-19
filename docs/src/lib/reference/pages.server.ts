import type {
  ApiExport,
  ApiFunction,
  ApiInterface,
  ApiManifest,
  ApiMember,
  ApiParameter,
} from './types';
import type { Block, Page, TableRowBlock } from '#lib/content';

import { parseContent } from '#lib/content';

import { moduleSlug } from './sidebar.server';

export function buildSymbolRegistry(manifest: ApiManifest) {
  const registry = new Map<string, string>();
  for (const module of manifest.modules) {
    for (const symbol of module.exports) {
      registry.set(symbol.name, symbolHref(module.id, symbol.name));
    }
  }
  return registry;
}

export function buildSymbolPage(
  symbol: ApiExport,
  moduleId: string,
  registry: Map<string, string>,
): Page {
  const blocks: Block[] = [];

  blocks.push(eyebrow(moduleId, symbol.kind));

  if (symbol.deprecated !== null) {
    blocks.push({
      children: [{ children: [{ type: 'text', value: symbol.deprecated }], type: 'paragraph' }],
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
  blocks.push({ label: null, language: 'ts', source: symbol.signature, type: 'code-block' });

  if (symbol.kind === 'function') {
    if (symbol.parameters.length > 0) {
      blocks.push(heading2('Parameters'));
      blocks.push(parametersTable(symbol.parameters, registry));
    }
    if (symbol.returnType !== 'void' || symbol.returnDescription) {
      blocks.push(heading2('Returns'));
      blocks.push(returnsParagraph(symbol, registry));
    }
  }

  if (symbol.kind === 'interface' && symbol.members.length > 0) {
    blocks.push(heading2('Members'));
    blocks.push(membersTable(symbol.members, registry));
  }

  if (symbol.examples.length > 0) {
    blocks.push(heading2('Examples'));
    for (const example of symbol.examples) {
      blocks.push(...parseContent(example).blocks);
    }
  }

  blocks.push(sourceLink(symbol.location.file, symbol.location.line));

  return { blocks, description: '', title: symbol.name };
}

function eyebrow(moduleId: string, kind: string): Block {
  return {
    children: [{ type: 'text', value: `${moduleId} · ${kind}` }],
    type: 'paragraph',
  };
}

function heading2(text: string): Block {
  return {
    children: [{ type: 'text', value: text }],
    id: slugify(text),
    level: 2,
    type: 'heading',
  };
}

function parametersTable(
  parameters: ApiParameter[],
  registry: Map<string, string>,
): Block {
  return {
    body: parameters.map((parameter) => paramRow(parameter, registry)),
    head: tableHeaderRow(['Name', 'Type', 'Description']),
    type: 'table',
  };
}

function membersTable(
  members: ApiMember[],
  registry: Map<string, string>,
): Block {
  return {
    body: members.map((member) => memberRow(member, registry)),
    head: tableHeaderRow(['Name', 'Type', 'Description']),
    type: 'table',
  };
}

function paramRow(
  parameter: ApiParameter,
  registry: Map<string, string>,
): TableRowBlock {
  return {
    children: [
      {
        children: [
          { type: 'inline-code', value: parameter.name + (parameter.optional ? '?' : '') },
        ],
        type: 'table-cell',
      },
      { children: typeToBlocks(parameter.type, registry), type: 'table-cell' },
      { children: [{ type: 'text', value: stripDashPrefix(parameter.description) }], type: 'table-cell' },
    ],
    type: 'table-row',
  };
}

function memberRow(
  member: ApiMember,
  registry: Map<string, string>,
): TableRowBlock {
  return {
    children: [
      {
        children: [
          { type: 'inline-code', value: member.name + (member.optional ? '?' : '') },
        ],
        type: 'table-cell',
      },
      { children: typeToBlocks(member.type, registry), type: 'table-cell' },
      { children: [{ type: 'text', value: stripDashPrefix(member.description) }], type: 'table-cell' },
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

function returnsParagraph(
  symbol: ApiFunction,
  registry: Map<string, string>,
): Block {
  const children: Block[] = typeToBlocks(symbol.returnType, registry);
  if (symbol.returnDescription) {
    children.push({ type: 'text', value: ` — ${symbol.returnDescription}` });
  }
  return { children, type: 'paragraph' };
}

function sourceLink(file: string, line: number): Block {
  return {
    children: [{ type: 'text', value: `${file}:${line}` }],
    type: 'paragraph',
  };
}

function typeToBlocks(
  typeString: string,
  registry: Map<string, string>,
): Block[] {
  const blocks: Block[] = [];
  const identifierRx = /[a-zA-Z_$][a-zA-Z0-9_$]*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null = identifierRx.exec(typeString);
  while (match !== null) {
    const href = registry.get(match[0]);
    if (href !== undefined) {
      if (match.index > lastIndex) {
        blocks.push({
          type: 'inline-code',
          value: typeString.slice(lastIndex, match.index),
        });
      }
      blocks.push({
        children: [{ type: 'inline-code', value: match[0] }],
        href,
        type: 'link',
      });
      lastIndex = match.index + match[0].length;
    }
    match = identifierRx.exec(typeString);
  }
  if (lastIndex < typeString.length) {
    blocks.push({
      type: 'inline-code',
      value: typeString.slice(lastIndex),
    });
  }
  if (blocks.length === 0) {
    blocks.push({ type: 'inline-code', value: typeString });
  }
  return blocks;
}

function symbolHref(moduleId: string, name: string) {
  const slug = moduleSlug(moduleId);
  return slug === 'yapyak' ? `/reference/${name}` : `/reference/${slug}/${name}`;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function stripDashPrefix(text: string) {
  return text.startsWith('- ') ? text.slice(2) : text;
}
