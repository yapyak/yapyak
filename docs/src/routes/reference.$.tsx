import { createFileRoute, notFound, redirect } from '@tanstack/react-router';

import { ReferenceSymbol } from '#components/reference-symbol';
import { loadReferenceSymbol } from '#lib/load-reference-symbol';

export const Route = createFileRoute('/reference/$')({
  component: Component,
  async loader({ params }) {
    const path = params._splat ?? '';
    if (path === '') {
      throw notFound();
    }
    const result = await loadReferenceSymbol({ data: path });
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
  const { symbol, descriptionTree, exampleTrees } = rendered;
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
      {descriptionTree && (
        <ReferenceSymbol.Description tree={descriptionTree} />
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
      {exampleTrees.length > 0 && (
        <ReferenceSymbol.Examples trees={exampleTrees} />
      )}
      <ReferenceSymbol.SourceLink
        file={symbol.location.file}
        line={symbol.location.line}
      />
    </ReferenceSymbol>
  );
}
