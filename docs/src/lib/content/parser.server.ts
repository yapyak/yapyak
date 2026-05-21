import type { Config, Schema } from '@markdoc/markdoc';
import type {
  Block,
  CalloutBlock,
  CodeBlock,
  MetaValue,
  TableBlock,
  TableCellBlock,
  TableRowBlock,
} from './types';

import Markdoc from '@markdoc/markdoc';

import { slugify } from './slugify';

export function parseContent(source: string) {
  const ast = Markdoc.parse(source);
  const frontmatterSource = ast.attributes.frontmatter as string | undefined;
  const frontmatter = frontmatterSource
    ? parseFrontmatter(frontmatterSource)
    : {};
  const transformed = Markdoc.transform(ast, markdocConfig);
  const raw = Array.isArray(transformed) ? transformed : [transformed];
  const blocks = raw.flatMap(toBlocks);
  return { blocks, frontmatter };
}

export function parseFrontmatterOnly(source: string) {
  const ast = Markdoc.parse(source);
  const frontmatterSource = ast.attributes.frontmatter as string | undefined;
  return frontmatterSource ? parseFrontmatter(frontmatterSource) : {};
}

function toBlocks(node: unknown): Block[] {
  if (typeof node === 'string') {
    return [{ type: 'text', value: node }];
  }
  if (typeof node === 'number' || typeof node === 'boolean') {
    return [{ type: 'text', value: String(node) }];
  }
  if (!Markdoc.Tag.isTag(node)) {
    return [];
  }

  const children = node.children.flatMap(toBlocks);

  switch (node.name) {
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return [
        {
          children,
          id: stringAttribute(node.attributes.id) ?? '',
          level: Number(node.name.slice(1)) as 1 | 2 | 3 | 4 | 5 | 6,
          type: 'heading',
        },
      ];
    case 'p':
      return [{ children, type: 'paragraph' }];
    case 'a': {
      const href = stringAttribute(node.attributes.href) ?? '';
      return [
        {
          children,
          href,
          kind: href.startsWith('/') ? 'internal' : 'external',
          type: 'link',
        },
      ];
    }
    case 'img':
      return [
        {
          alt: stringAttribute(node.attributes.alt),
          src: stringAttribute(node.attributes.src) ?? '',
          type: 'image',
        },
      ];
    case 'ul':
    case 'ol':
      return [
        {
          children: children.filter(isListItem),
          ordered: node.name === 'ol',
          type: 'list',
        },
      ];
    case 'li':
      return [{ children, type: 'list-item' }];
    case 'em':
      return [{ children, type: 'emphasis' }];
    case 'strong':
      return [{ children, type: 'strong' }];
    case 's':
      return [{ children, type: 'strikethrough' }];
    case 'code':
      return [{ type: 'inline-code', value: extractText(node.children) }];
    case 'blockquote':
      return [{ children, type: 'blockquote' }];
    case 'hr':
      return [{ type: 'divider' }];
    case 'br':
      return [{ type: 'line-break' }];
    case 'table':
      return [buildTable(node.children)];
    case 'thead':
    case 'tbody':
      return children;
    case 'tr':
      return [{ children: children.filter(isCell), type: 'table-row' }];
    case 'th':
      return [{ children, header: true, type: 'table-cell' }];
    case 'td':
      return [{ children, header: false, type: 'table-cell' }];
    case 'CodeBlock':
      return [buildCodeBlock(node.attributes)];
    case 'CodeGroup':
      return [
        {
          tabs: node.children
            .flatMap(toBlocks)
            .filter((block): block is CodeBlock => block.type === 'code-block'),
          type: 'code-group',
        },
      ];
    case 'Callout':
      return [buildCallout(node.attributes, children)];
    default:
      throw new Error(`parseContent: unknown tag "${node.name}"`);
  }
}

function buildTable(children: unknown[]): TableBlock {
  let head: TableRowBlock | null = null;
  const body: TableRowBlock[] = [];

  for (const child of children) {
    if (!Markdoc.Tag.isTag(child)) {
      continue;
    }
    if (child.name === 'thead') {
      const rows = child.children
        .flatMap(toBlocks)
        .filter((block): block is TableRowBlock => block.type === 'table-row');
      head = rows[0] ?? null;
    } else if (child.name === 'tbody') {
      const rows = child.children
        .flatMap(toBlocks)
        .filter((block): block is TableRowBlock => block.type === 'table-row');
      body.push(...rows);
    }
  }

  return { body, head, type: 'table' };
}

function buildCodeBlock(attributes: Record<string, unknown>): CodeBlock {
  return {
    label: stringAttribute(attributes.label),
    language: stringAttribute(attributes.language),
    source: stringAttribute(attributes.source) ?? '',
    type: 'code-block',
  };
}

function buildCallout(
  attributes: Record<string, unknown>,
  children: Block[],
): CalloutBlock {
  const variant = attributes.variant;
  if (
    variant !== 'tip' &&
    variant !== 'info' &&
    variant !== 'warning' &&
    variant !== 'danger'
  ) {
    throw new Error(`Callout: invalid variant "${String(variant)}"`);
  }
  return {
    children,
    title: stringAttribute(attributes.title),
    type: 'callout',
    variant,
  };
}

function isListItem(
  block: Block,
): block is Extract<Block, { type: 'list-item' }> {
  return block.type === 'list-item';
}

function isCell(block: Block): block is TableCellBlock {
  return block.type === 'table-cell';
}

function stringAttribute(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

const document: Schema = {
  attributes: {
    frontmatter: {
      render: false,
      type: String,
    },
  },
  transform(node, config) {
    return node.transformChildren(config);
  },
};

const heading: Schema = {
  attributes: {
    level: {
      render: false,
      required: true,
      type: Number,
    },
  },
  children: ['inline'],
  transform(node, config) {
    const attributes = node.transformAttributes(config);
    const children = node.transformChildren(config);
    const level = node.attributes.level as number;
    const slug = slugify(extractText(children));
    return new Markdoc.Tag(`h${level}`, { ...attributes, id: slug }, children);
  },
};

const fence: Schema = {
  attributes: {
    content: {
      render: false,
      required: true,
      type: String,
    },
    language: {
      render: false,
      type: String,
    },
  },
  transform(node) {
    const rawLanguage = node.attributes.language as string | undefined;
    const content = node.attributes.content as string;
    const { label, language } = parseLanguageLabel(rawLanguage);
    return new Markdoc.Tag('CodeBlock', {
      label,
      language,
      source: content,
    });
  },
};

const callout: Schema = {
  attributes: {
    title: {
      type: String,
    },
    variant: {
      matches: ['tip', 'info', 'warning', 'danger'],
      required: true,
      type: String,
    },
  },
  render: 'Callout',
};

const codeGroup: Schema = {
  render: 'CodeGroup',
};

const markdocConfig: Config = {
  nodes: {
    document,
    fence,
    heading,
  },
  tags: {
    callout,
    'code-group': codeGroup,
  },
};

function parseLanguageLabel(raw: string | undefined) {
  if (!raw) {
    return { label: undefined, language: undefined };
  }
  const match = raw.match(/^(\S*)\s*\[([^\]]+)\]$/);
  if (match) {
    return {
      label: match[2],
      language: match[1] || undefined,
    };
  }
  return { label: undefined, language: raw };
}

function extractText(children: unknown[]) {
  const parts: string[] = [];
  for (const child of children) {
    if (typeof child === 'string') {
      parts.push(child);
    } else if (Markdoc.Tag.isTag(child)) {
      parts.push(extractText(child.children));
    }
  }
  return parts.join('');
}

function parseFrontmatter(raw: string): Record<string, MetaValue> {
  const result: Record<string, MetaValue> = {};
  for (const line of raw.split('\n')) {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) {
      continue;
    }
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (!key) {
      continue;
    }
    const numeric = Number(value);
    result[key] = value && Number.isFinite(numeric) ? numeric : value;
  }
  return result;
}
