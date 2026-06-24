import type { CodeLocationBlock } from '@yapyak/doc-compiler';
import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './block-renderer-node-code-location.module.css';

export type BlockRendererNodeCodeLocationProps = BoxProps<'a'> & {
  block: CodeLocationBlock;
};

export function BlockRendererNodeCodeLocation(
  props: BlockRendererNodeCodeLocationProps,
) {
  const { block, className, ...restProps } = props;
  if (block.href !== null) {
    return (
      <Box
        {...restProps}
        as="a"
        className={[
          styles.BlockRendererNodeCodeLocation,
          className,
        ]}
        href={block.href}
        rel="noreferrer"
        target="_blank"
      >
        GitHub
      </Box>
    );
  }
  return (
    <Box
      as="span"
      className={styles.BlockRendererNodeCodeLocation}
    >
      {`${block.file}:${block.line}`}
    </Box>
  );
}
