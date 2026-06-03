import type { EyebrowBlock } from '@yapyak/doc-extractor';

import { Box } from '#components/box';

import styles from './block-renderer-node-eyebrow.module.css';
import { BlockRendererNodeEyebrowKindBadge } from './block-renderer-node-eyebrow-kind-badge';

export interface BlockRendererNodeEyebrowProps {
  block: EyebrowBlock;
}

export function BlockRendererNodeEyebrow(props: BlockRendererNodeEyebrowProps) {
  const { block } = props;
  return (
    <Box
      as="p"
      className={styles.BlockRendererNodeEyebrow}
    >
      {block.kind !== null && (
        <BlockRendererNodeEyebrowKindBadge variant={block.kind} />
      )}
      {block.module !== null && (
        <Box
          as="span"
          className={styles.ModuleText}
        >
          {block.module}
        </Box>
      )}
      {block.sourceHref !== null && (
        <Box
          as="a"
          className={styles.SourceLink}
          href={block.sourceHref}
          rel="noreferrer"
          target="_blank"
        >
          GitHub
          <Box
            aria-hidden="true"
            as="svg"
            className={styles.SourceLinkIcon}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M7 17 L17 7" />
            <path d="M8 7 H17 V16" />
          </Box>
        </Box>
      )}
    </Box>
  );
}
