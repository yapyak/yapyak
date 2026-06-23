import type { EyebrowBlock } from '@yapyak/doc-compiler';

import { Box } from '#components/box';
import { ExternalLink } from '#components/external-link';
import { KindBadge } from '#components/kind-badge';

import styles from './block-renderer-node-eyebrow.module.css';

export type BlockRendererNodeEyebrowProps = {
  block: EyebrowBlock;
};

export function BlockRendererNodeEyebrow(props: BlockRendererNodeEyebrowProps) {
  const { block } = props;

  return (
    <Box
      as="p"
      className={styles.BlockRendererNodeEyebrow}
    >
      {block.kind && <KindBadge variant={block.kind} />}
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
