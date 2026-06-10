import type { Block } from '@yapyak/doc-extractor';
import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './block-renderer.module.css';
import { BlockRendererNode } from './block-renderer-node';

export interface BlockRendererProps extends BoxProps {
  blocks: Block[];
}

export function BlockRenderer(props: BlockRendererProps) {
  const { blocks, className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      className={[
        styles.BlockRenderer,
        className,
      ]}
    >
      {blocks.map((block, index) => (
        <BlockRendererNode
          block={block}
          key={index}
        />
      ))}
    </Box>
  );
}
