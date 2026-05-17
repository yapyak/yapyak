import type { Config, Schema } from '@markdoc/markdoc';
import type { Block } from './types';

import Markdoc from '@markdoc/markdoc';

export function parseContent(source: string) {
  const ast = Markdoc.parse(source);
  const frontmatterSource = ast.attributes.frontmatter as string | undefined;
  const frontmatter = frontmatterSource
    ? parseFrontmatter(frontmatterSource)
    : {};
  const transformed = Markdoc.transform(ast, markdocConfig);
  const blocks = Array.isArray(transformed)
    ? transformed.map(toBlock)
    : [toBlock(transformed)];
  return { blocks, frontmatter };
}

export function parseFrontmatterOnly(source: string) {
  const ast = Markdoc.parse(source);
  const frontmatterSource = ast.attributes.frontmatter as string | undefined;
  return frontmatterSource ? parseFrontmatter(frontmatterSource) : {};
}

function toBlock(node: unknown): Block {
  if (Markdoc.Tag.isTag(node)) {
    return {
      attributes: node.attributes,
      children: node.children.map(toBlock),
      type: node.name,
      value: '',
    };
  }
  if (typeof node === 'string') {
    return {
      attributes: {},
      children: [],
      type: 'text',
      value: node,
    };
  }
  if (typeof node === 'number' || typeof node === 'boolean') {
    return {
      attributes: {},
      children: [],
      type: 'text',
      value: String(node),
    };
  }
  return {
    attributes: {},
    children: [],
    type: 'text',
    value: '',
  };
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

function parseFrontmatter(raw: string) {
  const result: Record<string, unknown> = {};
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

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}
