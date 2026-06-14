import type { Block, CodeExpressionBlock } from '@yapyak/doc-extractor';

import { Box } from '#components/box';

import { BlockRendererNode } from './block-renderer-node';
import styles from './block-renderer-node-code-expression.module.css';

export type BlockRendererNodeCodeExpressionProps = {
  block: CodeExpressionBlock;
};

export function BlockRendererNodeCodeExpression(
  props: BlockRendererNodeCodeExpressionProps,
) {
  const { block } = props;

  return (
    <Box
      as="code"
      className={styles.BlockRendererNodeCodeExpression}
    >
      {block.children.map((child: Block, index: number) => (
        <BlockRendererNode
          block={child}
          key={index}
        />
      ))}
    </Box>
  );
}
