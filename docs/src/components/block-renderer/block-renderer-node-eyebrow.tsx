import type { EyebrowBlock } from '@yapyak/doc-compiler';
import type { BoxProps } from '#primitives/box';

import { ExternalLink } from '#components/external-link';
import { KindBadge } from '#components/kind-badge';
import { Box } from '#primitives/box';

import styles from './block-renderer-node-eyebrow.module.css';

export type BlockRendererNodeEyebrowProps = BoxProps<'p'> & {
  block: EyebrowBlock;
};

export function BlockRendererNodeEyebrow(props: BlockRendererNodeEyebrowProps) {
  const { block, className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="p"
      className={[
        styles.BlockRendererNodeEyebrow,
        className,
      ]}
    >
      {block.exportKind && <KindBadge variant={block.exportKind} />}
      {block.module && (
        <Box
          as="span"
          className={styles.ModuleText}
        >
          {block.module}
        </Box>
      )}
      {block.sourceHref && (
        <ExternalLink
          className={styles.SourceLink}
          href={block.sourceHref}
          size="sm"
        >
          GitHub
        </ExternalLink>
      )}
    </Box>
  );
}
