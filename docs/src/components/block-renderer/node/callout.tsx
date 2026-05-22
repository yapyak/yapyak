import type { CalloutBlock } from '@yapyak/doc-extractor';

import { BlockRendererNode } from '../node';
import { Callout } from '#components/callout';

export interface NodeCalloutProps {
  block: CalloutBlock;
}

export function NodeCallout(props: NodeCalloutProps) {
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
