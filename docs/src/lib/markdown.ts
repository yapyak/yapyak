import type {
  RendererObject,
  TokenizerAndRendererExtension,
  Tokens,
} from 'marked';
import type { Lang } from '#utils/tokenize';

import { marked } from 'marked';

import { tokenize } from '#utils/tokenize';

export interface Doc {
  description: string;
  html: string;
  order: number;
  slug: string;
  title: string;
}

const SUPPORTED_LANGS = new Set<Lang>([
  'tsx',
  'ts',
  'jsx',
  'js',
  'svelte',
  'vue',
  'bash',
  'json',
  'diff',
]);

let groupCounter = 0;

function parseLangLabel(lang: string | undefined): {
  actualLang: string | undefined;
  label: string | undefined;
} {
  if (lang === undefined || lang === '') {
    return { actualLang: undefined, label: undefined };
  }
  const match = lang.match(/^(\S*)\s*\[([^\]]+)\]$/);
  if (match) {
    return {
      actualLang: match[1] !== '' ? match[1] : undefined,
      label: match[2],
    };
  }
  return { actualLang: lang, label: undefined };
}

function renderTokenizedCode(text: string, lang: string | undefined): string {
  if (lang !== undefined && SUPPORTED_LANGS.has(lang as Lang)) {
    const tokens = tokenize(text, lang as Lang);
    return tokens
      .map(
        (token) =>
          `<span class="tx-${token.type}">${escapeHtml(token.value)}</span>`,
      )
      .join('');
  }
  return escapeHtml(text);
}

function parseContainerBody(
  src: string,
): { body: string; consumed: number } | null {
  let depth = 0;
  let inCodeFence = false;
  let pos = 0;
  let bodyEnd = -1;
  let closeEnd = -1;
  while (pos < src.length) {
    const nlIdx = src.indexOf('\n', pos);
    const lineEnd = nlIdx === -1 ? src.length : nlIdx;
    const line = src.slice(pos, lineEnd);

    if (/^```/.test(line)) {
      inCodeFence = !inCodeFence;
    } else if (!inCodeFence) {
      if (/^:::\s*$/.test(line)) {
        if (depth === 0) {
          bodyEnd = pos;
          closeEnd = lineEnd + (nlIdx === -1 ? 0 : 1);
          break;
        }
        depth--;
      } else if (/^:::\s*\S/.test(line)) {
        depth++;
      }
    }

    if (nlIdx === -1) {
      break;
    }
    pos = nlIdx + 1;
  }

  if (bodyEnd === -1) {
    return null;
  }

  let body = src.slice(0, bodyEnd);
  if (body.endsWith('\n')) {
    body = body.slice(0, -1);
  }
  return { body, consumed: closeEnd };
}

const renderer: RendererObject = {
  code({ text, lang }: Tokens.Code): string {
    const { actualLang } = parseLangLabel(lang);
    const inner = renderTokenizedCode(text, actualLang);
    return `<div class="CodeBlock" data-lang="${escapeAttr(actualLang ?? '')}"><pre><code>${inner}</code></pre></div>`;
  },
  heading({ tokens, depth }: Tokens.Heading): string {
    const text = this.parser.parseInline(tokens);
    const slug = slugify(text);
    return `<h${depth} id="${escapeAttr(slug)}">${text}</h${depth}>\n`;
  },
};

interface CodeGroupBlock {
  html: string;
  label: string;
  lang: string | undefined;
}

const codeGroupExtension: TokenizerAndRendererExtension = {
  level: 'block',
  name: 'codeGroup',
  renderer(token) {
    const groupId = token.groupId as string;
    const blocks = token.blocks as CodeGroupBlock[];
    if (blocks.length === 0) {
      return '';
    }
    const tabs = blocks
      .map(
        (block, index) => `
          <label class="CodeGroupTab">
            <input
              type="radio"
              name="${escapeAttr(groupId)}"
              class="CodeGroupRadio"${index === 0 ? ' checked' : ''}
              aria-label="${escapeAttr(block.label)}"
            />
            <span>${escapeHtml(block.label)}</span>
          </label>
        `,
      )
      .join('');
    const panels = blocks
      .map(
        (block) =>
          `<div class="CodeGroupPanel" data-lang="${escapeAttr(block.lang ?? '')}">${block.html}</div>`,
      )
      .join('');
    return `<div class="CodeGroup"><div class="CodeGroupTabs">${tabs}</div><div class="CodeGroupPanels">${panels}</div></div>`;
  },
  start(src: string): number | undefined {
    const index = src.search(/^:::\s*code-group\b/m);
    return index === -1 ? undefined : index;
  },
  tokenizer(src: string) {
    const openMatch = /^:::\s*code-group\s*(?:\n|$)/.exec(src);
    if (openMatch === null) {
      return undefined;
    }
    const openLength = openMatch[0].length;
    const result = parseContainerBody(src.slice(openLength));
    if (result === null) {
      return undefined;
    }
    const childTokens = this.lexer.blockTokens(`${result.body}\n`);
    const blocks: CodeGroupBlock[] = [];
    for (const child of childTokens) {
      if (child.type === 'code') {
        const codeChild = child as Tokens.Code;
        const { actualLang, label } = parseLangLabel(codeChild.lang);
        blocks.push({
          html: `<pre><code>${renderTokenizedCode(codeChild.text, actualLang)}</code></pre>`,
          label: label ?? actualLang ?? 'Code',
          lang: actualLang,
        });
      }
    }
    return {
      blocks,
      groupId: `cg-${groupCounter++}`,
      raw: src.slice(0, openLength + result.consumed),
      type: 'codeGroup',
    };
  },
};

type CalloutVariant = 'tip' | 'info' | 'warning' | 'danger' | 'details';

const CALLOUT_DEFAULT_TITLES: Record<CalloutVariant, string> = {
  danger: 'Danger',
  details: 'Details',
  info: 'Info',
  tip: 'Tip',
  warning: 'Warning',
};

const calloutExtension: TokenizerAndRendererExtension = {
  level: 'block',
  name: 'callout',
  renderer(token) {
    const variant = token.variant as CalloutVariant;
    const title = token.title as string;
    const inner = this.parser.parse(token.tokens || []);
    if (variant === 'details') {
      return `<details class="Callout" data-variant="details"><summary class="CalloutTitle">${escapeHtml(title)}</summary><div class="CalloutBody">${inner}</div></details>`;
    }
    return `<aside class="Callout" data-variant="${variant}"><div class="CalloutTitle">${escapeHtml(title)}</div><div class="CalloutBody">${inner}</div></aside>`;
  },
  start(src: string): number | undefined {
    const index = src.search(/^:::\s*(?:tip|info|warning|danger|details)\b/m);
    return index === -1 ? undefined : index;
  },
  tokenizer(src: string) {
    const openMatch =
      /^:::\s*(tip|info|warning|danger|details)(?:\s+([^\n]+))?\s*(?:\n|$)/.exec(
        src,
      );
    if (openMatch === null) {
      return undefined;
    }
    const variant = openMatch[1] as CalloutVariant;
    const customTitle = openMatch[2]?.trim();
    const openLength = openMatch[0].length;
    const result = parseContainerBody(src.slice(openLength));
    if (result === null) {
      return undefined;
    }
    return {
      raw: src.slice(0, openLength + result.consumed),
      title: customTitle ?? CALLOUT_DEFAULT_TITLES[variant],
      tokens: this.lexer.blockTokens(`${result.body}\n`),
      type: 'callout',
      variant,
    };
  },
};

marked.use({
  extensions: [codeGroupExtension, calloutExtension],
  gfm: true,
  renderer,
});

export function renderMarkdown(source: string): {
  frontmatter: Record<string, unknown>;
  html: string;
} {
  const { frontmatter, body } = splitFrontmatter(source);
  const html = marked.parse(body) as string;
  return { frontmatter, html };
}

export function parseFrontmatter(source: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  return splitFrontmatter(source);
}

function splitFrontmatter(source: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const lines = source.split('\n');
  if (lines[0]?.trim() !== '---') {
    return { body: source, frontmatter: {} };
  }
  let closeIndex = -1;
  for (let index = 1; index < lines.length; index++) {
    if (lines[index]?.trim() === '---') {
      closeIndex = index;
      break;
    }
  }
  if (closeIndex === -1) {
    return { body: source, frontmatter: {} };
  }
  const body = lines.slice(closeIndex + 1).join('\n');
  const frontmatter: Record<string, unknown> = {};
  for (const line of lines.slice(1, closeIndex)) {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) {
      continue;
    }
    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    if (key === '') {
      continue;
    }
    const numeric = Number(rawValue);
    frontmatter[key] =
      rawValue !== '' && Number.isFinite(numeric) ? numeric : rawValue;
  }
  return { body, frontmatter };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;/gi, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}
