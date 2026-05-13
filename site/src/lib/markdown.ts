import { marked, type RendererObject, type Tokens } from 'marked';
import { parse as parseYaml } from 'yaml';
import { type Lang, tokenize } from './utils/tokenize.js';

export interface Doc {
  title: string;
  description: string;
  order: number;
  slug: string;
  html: string;
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
]);

const renderer: RendererObject = {
  code({ text, lang }: Tokens.Code): string {
    if (lang !== undefined && SUPPORTED_LANGS.has(lang as Lang)) {
      const tokens = tokenize(text, lang as Lang);
      const spans = tokens
        .map(
          (token) =>
            `<span class="tx-${token.type}">${escapeHtml(token.value)}</span>`,
        )
        .join('');
      return `<div class="CodeBlock" data-lang="${escapeAttr(lang)}"><pre><code>${spans}</code></pre></div>`;
    }
    return `<pre><code>${escapeHtml(text)}</code></pre>`;
  },
  heading({ tokens, depth }: Tokens.Heading): string {
    const text = this.parser.parseInline(tokens);
    const slug = slugify(text);
    return `<h${depth} id="${escapeAttr(slug)}">${text}</h${depth}>\n`;
  },
};

marked.use({ gfm: true, renderer });

export function renderMarkdown(source: string): {
  frontmatter: Record<string, unknown>;
  html: string;
} {
  const { frontmatter, body } = splitFrontmatter(source);
  const html = marked.parse(body) as string;
  return { frontmatter, html };
}

function splitFrontmatter(source: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const lines = source.split('\n');
  if (lines[0]?.trim() !== '---') {
    return { frontmatter: {}, body: source };
  }
  let closeIndex = -1;
  for (let index = 1; index < lines.length; index++) {
    if (lines[index]?.trim() === '---') {
      closeIndex = index;
      break;
    }
  }
  if (closeIndex === -1) {
    return { frontmatter: {}, body: source };
  }
  const yamlText = lines.slice(1, closeIndex).join('\n');
  const body = lines.slice(closeIndex + 1).join('\n');
  const parsed = parseYaml(yamlText);
  if (parsed === null || typeof parsed !== 'object') {
    return { frontmatter: {}, body };
  }
  return { frontmatter: parsed as Record<string, unknown>, body };
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
