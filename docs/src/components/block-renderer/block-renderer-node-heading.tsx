import type { HeadingBlock } from '@yapyak/doc-extractor';

import { Box } from '#components/box';

import { BlockRendererNode } from './block-renderer-node';
import styles from './block-renderer-node-heading.module.css';

export type BlockRendererNodeHeadingProps = {
  block: HeadingBlock;
};

export function BlockRendererNodeHeading(props: BlockRendererNodeHeadingProps) {
  const { block } = props;
  return (
    <Box
      as={headingTag(block.level)}
      className={styles.BlockRendererNodeHeading}
      data-level={block.level}
      id={block.id}
    >
      {block.children.map((child, index) => (
        <BlockRendererNode
          block={child}
          key={index}
        />
      ))}
    </Box>
  );
}

function headingTag(level: HeadingBlock['level']) {
  switch (level) {
    case 1:
      return 'h1';
    case 2:
      return 'h2';
    case 3:
      return 'h3';
    case 4:
      return 'h4';
    case 5:
      return 'h5';
    case 6:
      return 'h6';
  }
}
