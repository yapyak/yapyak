import { createFileRoute, notFound, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import type { ReactElement } from 'react';
import { ReferenceSymbol } from '#components/reference-symbol';
import type { ApiExport, ApiModule } from '#docs/extract-api';

interface RenderedSymbol {
  symbol: ApiExport;
  descriptionHtml: string;
  signatureHtml: string;
  exampleHtmls: string[];
}

type Resolved =
  | { kind: 'symbol'; module: ApiModule; rendered: RenderedSymbol }
  | { kind: 'redirect-to-first-symbol'; targetPath: string }
  | { kind: 'not-found' };

const loadDoc = createServerFn({ method: 'GET' })
  .inputValidator((path: string) => path)
  .handler(async ({ data: path }): Promise<Resolved> => {
    const { loadManifest } = await import('#docs/load-manifest');
    const { renderMarkdown } = await import('#lib/markdown');
    const manifest = await loadManifest(process.cwd());

    const moduleId = slugToModuleId(path);
    const moduleMatch = manifest.modules.find((m) => m.id === moduleId);
    if (moduleMatch !== undefined) {
      const firstExport = moduleMatch.exports[0];
      if (firstExport === undefined) {
        return { kind: 'not-found' };
      }
      const isRoot = moduleMatch.id === 'yapyak';
      const slug = moduleSlugInline(moduleMatch.id);
      return {
        kind: 'redirect-to-first-symbol',
        targetPath: isRoot ? firstExport.name : `${slug}/${firstExport.name}`,
      };
    }

    const lastSlash = path.lastIndexOf('/');
    const parentSlug = lastSlash === -1 ? '' : path.slice(0, lastSlash);
    const symbolName = lastSlash === -1 ? path : path.slice(lastSlash + 1);
    const parentId = slugToModuleId(parentSlug);
    const parent = manifest.modules.find((m) => m.id === parentId);
    if (parent === undefined) {
      return { kind: 'not-found' };
    }
    const symbol = parent.exports.find((e) => e.name === symbolName);
    if (symbol === undefined) {
      return { kind: 'not-found' };
    }
    const descriptionHtml =
      symbol.description === ''
        ? ''
        : renderMarkdown(symbol.description).html;
    const signatureHtml = renderMarkdown(
      `\`\`\`ts\n${symbol.signature}\n\`\`\``,
    ).html;
    const exampleHtmls = symbol.examples.map(
      (example) => renderMarkdown(example).html,
    );
    return {
      kind: 'symbol',
      module: parent,
      rendered: { symbol, descriptionHtml, signatureHtml, exampleHtmls },
    };
  });

function slugToModuleId(slug: string): string {
  if (slug === '' || slug === 'yapyak') {
    return 'yapyak';
  }
  return `yapyak/${slug}`;
}

function moduleSlugInline(id: string): string {
  const trimmed = id.replace(/^yapyak\/?/, '');
  return trimmed === '' ? 'yapyak' : trimmed;
}

export const Route = createFileRoute('/reference/$')({
  async loader({ params }) {
    const path = params._splat ?? '';
    if (path === '') {
      throw notFound();
    }
    const resolved = await loadDoc({ data: path });
    if (resolved.kind === 'not-found') {
      throw notFound();
    }
    if (resolved.kind === 'redirect-to-first-symbol') {
      throw redirect({
        to: '/reference/$',
        params: { _splat: resolved.targetPath },
        replace: true,
      });
    }
    return { module: resolved.module, rendered: resolved.rendered };
  },
  component: Component,
});

function Component(): ReactElement {
  const { module, rendered } = Route.useLoaderData();
  const { symbol, descriptionHtml, signatureHtml, exampleHtmls } = rendered;
  return (
    <ReferenceSymbol>
      <ReferenceSymbol.Header
        module={module.id}
        kind={symbol.kind}
        name={symbol.name}
      />
      {symbol.deprecated !== null ? (
        <ReferenceSymbol.Deprecated message={symbol.deprecated} />
      ) : null}
      {descriptionHtml !== '' ? (
        <ReferenceSymbol.Description html={descriptionHtml} />
      ) : null}
      <ReferenceSymbol.Signature html={signatureHtml} />
      {symbol.kind === 'function' && symbol.parameters.length > 0 ? (
        <ReferenceSymbol.MemberTable
          title="Parameters"
          members={symbol.parameters}
        />
      ) : null}
      {symbol.kind === 'function' &&
      (symbol.returnType !== 'void' || symbol.returnDescription !== '') ? (
        <ReferenceSymbol.Returns
          type={symbol.returnType}
          description={symbol.returnDescription}
        />
      ) : null}
      {symbol.kind === 'interface' && symbol.members.length > 0 ? (
        <ReferenceSymbol.MemberTable title="Members" members={symbol.members} />
      ) : null}
      {exampleHtmls.length > 0 ? (
        <ReferenceSymbol.Examples htmls={exampleHtmls} />
      ) : null}
      <ReferenceSymbol.SourceLink
        file={symbol.location.file}
        line={symbol.location.line}
      />
    </ReferenceSymbol>
  );
}
