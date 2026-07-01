import type { Block, CodeExpressionBlock } from '@yapyak/doc-compiler';
import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import { BlockRendererNode } from './block-renderer-node';
import styles from './block-renderer-node-code-expression.module.css';

export type BlockRendererNodeCodeExpressionProps = BoxProps<'code'> & {
  block: CodeExpressionBlock;
};

export function BlockRendererNodeCodeExpression(
  props: BlockRendererNodeCodeExpressionProps,
) {
  const { block, className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="code"
      className={[
        styles.BlockRendererNodeCodeExpression,
        className,
      ]}
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
