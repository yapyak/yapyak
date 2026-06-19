import type { OnlyBlock } from '@yapyak/doc-compiler';

import { Box } from '#components/box';
import { useOptionsContext } from '#components/options';

import { BlockRenderer } from './block-renderer';

export type BlockRendererNodeOnlyProps = {
  block: OnlyBlock;
};

export function BlockRendererNodeOnly(props: BlockRendererNodeOnlyProps) {
  const { block } = props;
  const { get } = useOptionsContext();
  const active = get(block.group);
  const visible = active === block.value;

  return (
    <Box
      data-only-group={block.group}
      data-only-value={block.value}
      hidden={!visible}
    >
      <BlockRenderer blocks={block.children} />
    </Box>
  );
}
