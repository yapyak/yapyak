import type { Block } from '@yapyak/doc-compiler';

import { Box } from '#primitives/box';

import { BlockRenderer } from './block-renderer';

export type BlockRendererNodeSwitchBranchProps = {
  blocks: Block[];
  isVisible: boolean;
  value: string;
};

export function BlockRendererNodeSwitchBranch(
  props: BlockRendererNodeSwitchBranchProps,
) {
  const { blocks, isVisible, value } = props;

  return (
    <Box
      data-when-value={value}
      hidden={!isVisible}
    >
      <BlockRenderer blocks={blocks} />
    </Box>
  );
}
