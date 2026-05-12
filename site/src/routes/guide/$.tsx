import { createFileRoute, notFound } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import type { ReactElement } from 'react';
import styles from './$.module.css';

const loadDoc = createServerFn({ method: 'GET' })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
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
      return {
        title: (frontmatter.title as string | undefined) ?? slug,
        description: (frontmatter.description as string | undefined) ?? '',
        html,
      };
    }
    return null;
  });

export const Route = createFileRoute('/guide/$')({
  async loader({ params }) {
    const slug = params._splat ?? '';
    if (slug === '') {
      throw notFound();
    }
    const doc = await loadDoc({ data: slug });
    if (doc === null) {
      throw notFound();
    }
    return { doc };
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
