import type { HeadingBlock } from '@yapyak/doc-compiler';
import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';
import { HashIcon } from '#components/hash-icon';

import { BlockRendererNode } from './block-renderer-node';
import styles from './block-renderer-node-heading.module.css';

export type BlockRendererNodeHeadingProps = BoxProps<'a'> & {
  block: HeadingBlock;
};

export function BlockRendererNodeHeading(props: BlockRendererNodeHeadingProps) {
  const { block, className, ...restProps } = props;

  const isLinkable = block.level >= 2;

  const content = block.children.map((child, index) => (
    <BlockRendererNode
      block={child}
      key={index}
    />
  ));

  return (
    <Box
      as={getHeadingTag(block.level)}
      className={[
        styles.BlockRendererNodeHeading,
        className,
      ]}
      data-level={block.level}
      id={block.id}
    >
      {isLinkable ? (
        <Box
          {...restProps}
          as="a"
          className={styles.HeadingLink}
          href={`#${block.id}`}
        >
          <Box
            aria-hidden="true"
            as="span"
            className={styles.HashIcon}
          >
            <HashIcon />
          </Box>
          {content}
        </Box>
      ) : (
        content
      )}
    </Box>
  );
}

function getHeadingTag(level: HeadingBlock['level']) {
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
    default:
      return 'h6';
  }
}
