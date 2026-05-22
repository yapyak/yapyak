import type { ParagraphBlock } from '@yapyak/doc-extractor';

import { BlockRendererNode } from '../node';
import { Box } from '#components/box';

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
