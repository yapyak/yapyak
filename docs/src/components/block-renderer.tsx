import type { BoxProps } from '#components/box';
import type { Block } from '#lib/content';

import { Box } from '#components/box';

import { Item } from './block-renderer/item';
import styles from './block-renderer.module.css';

export interface BlockRendererProps extends BoxProps {
  blocks: Block[];
}

export function BlockRenderer(props: BlockRendererProps) {
  const { blocks, className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      className={[styles.BlockRenderer, className]}
    >
      {blocks.map((block, index) => (
        <Item
          key={index}
          block={block}
        />
      ))}
    </Box>
  );
}
