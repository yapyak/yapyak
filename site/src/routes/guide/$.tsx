import { createFileRoute, notFound, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import type { ReactElement } from 'react';
import styles from './$.module.css';

type DocResult =
  | {
      kind: 'doc';
      title: string;
      description: string;
      html: string;
    }
  | {
      kind: 'redirect';
      target: string;
    };

const loadDoc = createServerFn({ method: 'GET' })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }): Promise<DocResult | null> => {
    const { readFile } = await import('node:fs/promises');
    const { join } = await import('node:path');
    const { renderMarkdown } = await import('#lib/markdown');
    const candidates = [
      join(process.cwd(), 'content', 'guide', `${slug}.md`),
      join(process.cwd(), 'content', 'guide', slug, 'index.md'),
    ];
    for (const path of candidates) {
      const source = await readFile(path, 'utf8').catch(() => null);
      if (source === null) {
        continue;
      }
      const { frontmatter, html } = await renderMarkdown(source);

      const redirectField = frontmatter.redirect;
      if (typeof redirectField === 'string' && redirectField.length > 0) {
        const target = resolveRedirect(slug, redirectField);
        if (target !== `/guide/${slug}`) {
          return { kind: 'redirect', target };
        }
      }

      const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
      const titleFromH1 =
        h1Match !== null && h1Match[1] !== undefined
          ? h1Match[1].replace(/<[^>]+>/g, '').trim()
          : null;
      const body = html.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>\s*/, '');
      const title =
        (frontmatter.title as string | undefined) ?? titleFromH1 ?? slug;
      return {
        kind: 'doc',
        title,
        description: (frontmatter.description as string | undefined) ?? '',
        html: body,
      };
    }
    return null;
  });

function resolveRedirect(fromSlug: string, target: string): string {
  if (target.startsWith('/')) {
    return target;
  }
  const fromSegments = fromSlug.split('/').filter((segment) => segment !== '');
  const targetSegments = target.split('/');
  for (const segment of targetSegments) {
    if (segment === '' || segment === '.') {
      continue;
    }
    if (segment === '..') {
      fromSegments.pop();
      continue;
    }
    fromSegments.push(segment);
  }
  return `/guide/${fromSegments.join('/')}`;
}

export const Route = createFileRoute('/guide/$')({
  async loader({ params }) {
    const slug = params._splat ?? '';
    if (slug === '') {
      throw notFound();
    }
    const result = await loadDoc({ data: slug });
    if (result === null) {
      throw notFound();
    }
    if (result.kind === 'redirect') {
      throw redirect({ to: result.target, replace: true });
    }
    return { doc: result };
  },
  component: Component,
});

function Component(): ReactElement {
  const { doc } = Route.useLoaderData();
  return (
    <article className={styles.DocArticle}>
      <header className={styles.Header}>
        <h1 className={styles.Title}>{doc.title}</h1>
        {doc.description.length > 0 ? (
          <p className={styles.Description}>{doc.description}</p>
        ) : null}
      </header>
      <div
        className={styles.Body}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: rendered server-side from trusted markdown
        dangerouslySetInnerHTML={{ __html: doc.html }}
      />
    </article>
  );
}
