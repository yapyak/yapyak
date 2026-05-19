import type { ParagraphBlock } from '#lib/content';

import { Box } from '#components/box';

import { BlockRendererNode } from '../node';
import styles from './paragraph.module.css';

export interface NodeParagraphProps {
  block: ParagraphBlock;
}

export function NodeParagraph(props: NodeParagraphProps) {
  const { block } = props;
  return (
    <Box
      as="p"
      className={styles.Paragraph}
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
