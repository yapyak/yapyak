import type { OnlyBlock } from '@yapyak/doc-compiler';
import type { BoxProps } from '#primitives/box';

import { useOptionContext } from '#components/option-provider';
import { Box } from '#primitives/box';

import { BlockRenderer } from './block-renderer';

export type BlockRendererNodeOnlyProps = BoxProps & {
  block: OnlyBlock;
};

export function BlockRendererNodeOnly(props: BlockRendererNodeOnlyProps) {
  const { block } = props;
  const { get } = useOptionContext();
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
