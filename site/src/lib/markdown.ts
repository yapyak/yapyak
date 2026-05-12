import rehypeShiki from '@shikijs/rehype';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { parse as parseYaml } from 'yaml';

export interface Doc {
  title: string;
  description: string;
  order: number;
  slug: string;
  html: string;
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkFrontmatter, ['yaml'])
  .use(remarkRehype)
  .use(rehypeSlug)
  .use(rehypeShiki, {
    theme: 'vesper',
  })
  .use(rehypeStringify);

export async function renderMarkdown(source: string): Promise<{
  frontmatter: Record<string, unknown>;
  html: string;
}> {
  const tree = processor.parse(source);
  const frontmatter = extractFrontmatter(tree);
  const hast = await processor.run(tree);
  const html = processor.stringify(hast);
  return {
    frontmatter,
    html,
  };
}

function extractFrontmatter(tree: ReturnType<typeof processor.parse>): Record<string, unknown> {
  const root = tree as { children: Array<{ type: string; value?: string }> };
  const yaml = root.children.find((node) => node.type === 'yaml');
  if (yaml?.value === undefined) {
    return {};
  }
  const parsed = parseYaml(yaml.value);
  if (parsed === null || typeof parsed !== 'object') {
    return {};
  }
  return parsed as Record<string, unknown>;
}
