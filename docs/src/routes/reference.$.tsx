import { createFileRoute, notFound, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

import { ReferenceSymbol } from '#components/reference-symbol';
import { loadReferenceSymbol } from '#lib/reference';

const loadData = createServerFn()
  .inputValidator((path: string) => path)
  .handler(({ data: path }) => loadReferenceSymbol(path));

export const Route = createFileRoute('/reference/$')({
  component: Component,
  async loader({ params }) {
    const path = params._splat ?? '';
    if (!path) {
      throw notFound();
    }
    const result = await loadData({ data: path });
    if (result.kind === 'not-found') {
      throw notFound();
    }
    if (result.kind === 'redirect') {
      throw redirect({
        params: { _splat: result.target },
        replace: true,
        to: '/reference/$',
      });
    }
    return { module: result.module, rendered: result.rendered };
  },
});

function Component() {
  const { module, rendered } = Route.useLoaderData();
  const { symbol, descriptionBlocks, exampleBlocks } = rendered;
  return (
    <ReferenceSymbol>
      <ReferenceSymbol.Header
        kind={symbol.kind}
        module={module.id}
        name={symbol.name}
      />
      {symbol.deprecated && (
        <ReferenceSymbol.Deprecated message={symbol.deprecated} />
      )}
      {descriptionBlocks && (
        <ReferenceSymbol.Description blocks={descriptionBlocks} />
      )}
      <ReferenceSymbol.Signature source={symbol.signature} />
      {symbol.kind === 'function' && symbol.parameters.length > 0 && (
        <ReferenceSymbol.MemberTable
          members={symbol.parameters}
          title="Parameters"
        />
      )}
      {symbol.kind === 'function' &&
        (symbol.returnType !== 'void' || symbol.returnDescription) && (
          <ReferenceSymbol.Returns
            description={symbol.returnDescription}
            type={symbol.returnType}
          />
        )}
      {symbol.kind === 'interface' && symbol.members.length > 0 && (
        <ReferenceSymbol.MemberTable
          members={symbol.members}
          title="Members"
        />
      )}
      {exampleBlocks.length > 0 && (
        <ReferenceSymbol.Examples examples={exampleBlocks} />
      )}
      <ReferenceSymbol.SourceLink
        file={symbol.location.file}
        line={symbol.location.line}
      />
    </ReferenceSymbol>
  );
}
