import type { EmphasisBlock } from '#lib/content';

import { Box } from '#components/box';

import { BlockRendererNode } from '../node';

export interface BlockRendererNodeEmphasisProps {
  block: EmphasisBlock;
}

export function BlockRendererNodeEmphasis(
  props: BlockRendererNodeEmphasisProps,
) {
  const { block } = props;
  return (
    <Box as="em">
      {block.children.map((child, index) => (
        <BlockRendererNode
          key={index}
          block={child}
        />
      ))}
    </Box>
  );
}
