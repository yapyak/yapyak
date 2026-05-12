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
      const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
      const titleFromH1 =
        h1Match !== null && h1Match[1] !== undefined
          ? h1Match[1].replace(/<[^>]+>/g, '').trim()
          : null;
      const body = html.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>\s*/, '');
      const title =
        (frontmatter.title as string | undefined) ?? titleFromH1 ?? slug;
      return {
        title,
        description: (frontmatter.description as string | undefined) ?? '',
        html: body,
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
