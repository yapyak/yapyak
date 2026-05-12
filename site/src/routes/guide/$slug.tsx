import { createFileRoute, notFound } from '@tanstack/react-router';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ReactElement } from 'react';
import { renderMarkdown } from '../../lib/markdown';

export const Route = createFileRoute('/guide/$slug')({
  async loader({ params }) {
    try {
      const path = join(process.cwd(), 'content', 'guide', `${params.slug}.md`);
      const source = await readFile(path, 'utf8');
      const { frontmatter, html } = await renderMarkdown(source);
      return {
        doc: {
          title: (frontmatter.title as string | undefined) ?? params.slug,
          description: (frontmatter.description as string | undefined) ?? '',
          html,
        },
      };
    } catch {
      throw notFound();
    }
  },
  component: Component,
});

function Component(): ReactElement {
  const { doc } = Route.useLoaderData();
  return (
    <article>
      <header className="mb-8">
        <h1 className="text-4xl font-black tracking-tight">{doc.title}</h1>
        {doc.description.length > 0 ? (
          <p className="mt-2 text-lg text-ink-300">{doc.description}</p>
        ) : null}
      </header>
      <div
        // biome-ignore lint/security/noDangerouslySetInnerHtml: rendered server-side from trusted markdown
        dangerouslySetInnerHTML={{ __html: doc.html }}
      />
    </article>
  );
}
