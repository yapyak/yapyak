import type { CalloutBlock } from '@yapyak/doc-compiler';

import { Callout } from '#components/callout';

import { BlockRendererNode } from './block-renderer-node';

export type BlockRendererNodeCalloutProps = {
  block: CalloutBlock;
};

export function BlockRendererNodeCallout(props: BlockRendererNodeCalloutProps) {
  const { block } = props;

  return (
    <Callout
      title={block.title ?? undefined}
      variant={block.variant}
    >
      {block.children.map((child, index) => (
        <BlockRendererNode
          block={child}
          key={index}
        />
      ))}
    </Callout>
  );
}
