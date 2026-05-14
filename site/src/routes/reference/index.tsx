import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import type { ReactElement } from 'react';
import styles from './index.module.css';

const loadIntroduction = createServerFn({ method: 'GET' }).handler(async () => {
  const { readFile } = await import('node:fs/promises');
  const { join } = await import('node:path');
  const { renderMarkdown } = await import('#lib/markdown');
  const path = join(process.cwd(), 'content', 'reference', 'introduction.md');
  const source = await readFile(path, 'utf8');
  const { frontmatter, html } = await renderMarkdown(source);
  return {
    title: (frontmatter.title as string | undefined) ?? 'API Reference',
    description: (frontmatter.description as string | undefined) ?? '',
    html,
  };
});

export const Route = createFileRoute('/reference/')({
  async loader() {
    const introduction = await loadIntroduction();
    return { introduction };
  },
  component: Component,
});

function Component(): ReactElement {
  const { introduction } = Route.useLoaderData();
  return (
    <article className={styles.IntroductionArticle}>
      <header className={styles.Header}>
        <h1 className={styles.Title}>{introduction.title}</h1>
        {introduction.description !== '' ? (
          <p className={styles.Description}>{introduction.description}</p>
        ) : null}
      </header>
      <div
        className={styles.Body}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: server-rendered markdown
        dangerouslySetInnerHTML={{ __html: introduction.html }}
      />
    </article>
  );
}
