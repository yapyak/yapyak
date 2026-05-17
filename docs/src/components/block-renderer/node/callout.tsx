import type { CalloutBlock } from '#lib/content';

import { Callout } from '#components/callout';

import { BlockRendererNode } from '../node';

export interface BlockRendererNodeCalloutProps {
  block: CalloutBlock;
}

export function BlockRendererNodeCallout(
  props: BlockRendererNodeCalloutProps,
) {
  const { block } = props;
  return (
    <Callout
      title={block.title ?? undefined}
      variant={block.variant}
    >
      {block.children.map((child, index) => (
        <BlockRendererNode
          key={index}
          block={child}
        />
      ))}
    </Callout>
  );
}
