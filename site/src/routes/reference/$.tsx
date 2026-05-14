import { createFileRoute, notFound, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import type { ReactElement } from 'react';
import type { ApiExport, ApiModule } from '#docs/extract-api';
import styles from './$.module.css';

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
  return <SymbolPage module={module} rendered={rendered} />;
}

interface SymbolPageProps {
  module: ApiModule;
  rendered: RenderedSymbol;
}

function SymbolPage(props: SymbolPageProps): ReactElement {
  const { module, rendered } = props;
  const { symbol, descriptionHtml, signatureHtml, exampleHtmls } = rendered;
  return (
    <article className={styles.SymbolArticle}>
      <header className={styles.Header}>
        <span className={styles.Eyebrow}>
          {module.id} <span className={styles.EyebrowDot}>·</span>{' '}
          {symbol.kind}
        </span>
        <h1 className={styles.Heading}>{symbol.name}</h1>
      </header>

      {symbol.deprecated !== null ? (
        <div className={styles.DeprecatedNotice}>
          <strong>Deprecated.</strong> {symbol.deprecated}
        </div>
      ) : null}

      {descriptionHtml !== '' ? (
        <section className={styles.Section}>
          <div
            className={styles.DescriptionBody}
            // biome-ignore lint/security/noDangerouslySetInnerHtml: server-rendered markdown
            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
          />
        </section>
      ) : null}

      <SignatureBlock html={signatureHtml} />

      {symbol.kind === 'function' && symbol.parameters.length > 0 ? (
        <ParamTable parameters={symbol.parameters} />
      ) : null}

      {symbol.kind === 'function' &&
      (symbol.returnType !== 'void' || symbol.returnDescription !== '') ? (
        <ReturnsBlock
          returnType={symbol.returnType}
          returnDescription={symbol.returnDescription}
        />
      ) : null}

      {symbol.kind === 'interface' && symbol.members.length > 0 ? (
        <MemberTable members={symbol.members} />
      ) : null}

      {exampleHtmls.length > 0 ? (
        <ExamplesBlock htmls={exampleHtmls} />
      ) : null}

      <SourceLink location={symbol.location} />
    </article>
  );
}

interface SignatureBlockProps {
  html: string;
}

function SignatureBlock(props: SignatureBlockProps): ReactElement {
  const { html } = props;
  return (
    <section className={styles.Section}>
      <h2 className={styles.SectionHeading}>Signature</h2>
      <div
        className={styles.SignatureBody}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: server-rendered markdown
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}

interface ParamTableProps {
  parameters: Extract<ApiExport, { kind: 'function' }>['parameters'];
}

function ParamTable(props: ParamTableProps): ReactElement {
  const { parameters } = props;
  return (
    <section className={styles.Section}>
      <h2 className={styles.SectionHeading}>Parameters</h2>
      <table className={styles.MemberTable}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {parameters.map((p) => (
            <tr key={p.name}>
              <td>
                <code>{p.name}</code>
                {p.optional ? (
                  <span className={styles.Optional}>?</span>
                ) : null}
              </td>
              <td>
                <code>{p.type}</code>
              </td>
              <td>{stripDashPrefix(p.description)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

interface MemberTableProps {
  members: Extract<ApiExport, { kind: 'interface' }>['members'];
}

function MemberTable(props: MemberTableProps): ReactElement {
  const { members } = props;
  return (
    <section className={styles.Section}>
      <h2 className={styles.SectionHeading}>Members</h2>
      <table className={styles.MemberTable}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.name}>
              <td>
                <code>{m.name}</code>
                {m.optional ? (
                  <span className={styles.Optional}>?</span>
                ) : null}
              </td>
              <td>
                <code>{m.type}</code>
              </td>
              <td>{m.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

interface ReturnsBlockProps {
  returnType: string;
  returnDescription: string;
}

function ReturnsBlock(props: ReturnsBlockProps): ReactElement {
  const { returnType, returnDescription } = props;
  return (
    <section className={styles.Section}>
      <h2 className={styles.SectionHeading}>Returns</h2>
      <p className={styles.ReturnsParagraph}>
        <code>{returnType}</code>
        {returnDescription !== '' ? ` — ${returnDescription}` : null}
      </p>
    </section>
  );
}

interface ExamplesBlockProps {
  htmls: string[];
}

function ExamplesBlock(props: ExamplesBlockProps): ReactElement {
  const { htmls } = props;
  return (
    <section className={styles.Section}>
      <h2 className={styles.SectionHeading}>Examples</h2>
      {htmls.map((html, index) => (
        <div
          key={index}
          className={styles.ExampleBody}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: server-rendered markdown
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ))}
    </section>
  );
}

interface SourceLinkProps {
  location: ApiExport['location'];
}

function SourceLink(props: SourceLinkProps): ReactElement {
  const { location } = props;
  return (
    <footer className={styles.Footer}>
      <span className={styles.SourcePath}>
        {location.file}:{location.line}
      </span>
    </footer>
  );
}

function stripDashPrefix(text: string): string {
  return text.startsWith('- ') ? text.slice(2) : text;
}
