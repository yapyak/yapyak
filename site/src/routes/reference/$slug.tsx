import { createFileRoute, notFound } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import type { ReactElement } from 'react';
import styles from './$slug.module.css';

const loadDoc = createServerFn({ method: 'GET' })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const { readFile } = await import('node:fs/promises');
    const { join } = await import('node:path');
    const { renderMarkdown } = await import('#lib/markdown');
    try {
      const path = join(process.cwd(), 'content', 'reference', `${slug}.md`);
      const source = await readFile(path, 'utf8');
      const { frontmatter, html } = await renderMarkdown(source);
      return {
        title: (frontmatter.title as string | undefined) ?? slug,
        description: (frontmatter.description as string | undefined) ?? '',
        html,
      };
    } catch {
      return null;
    }
  });

export const Route = createFileRoute('/reference/$slug')({
  async loader({ params }) {
    const doc = await loadDoc({ data: params.slug });
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
