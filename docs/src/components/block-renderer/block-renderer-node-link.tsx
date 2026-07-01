import type { LinkBlock } from '@yapyak/doc-compiler';
import type { BoxProps } from '#primitives/box';

import { ExternalLink } from '#components/external-link';
import { LinkBase } from '#primitives/link';

import { BlockRendererNode } from './block-renderer-node';
import styles from './block-renderer-node-link.module.css';

export type BlockRendererNodeLinkProps = BoxProps & {
  block: LinkBlock;
};

export function BlockRendererNodeLink(props: BlockRendererNodeLinkProps) {
  const { block, className } = props;
  const children = block.children.map((child, index) => (
    <BlockRendererNode
      block={child}
      key={index}
    />
  ));

  if (block.linkKind === 'internal') {
    return (
      <LinkBase
        className={[
          styles.BlockRendererNodeLink,
          className,
        ]}
        to={block.href}
      >
        {children}
      </LinkBase>
    );
  }

  return <ExternalLink href={block.href}>{children}</ExternalLink>;
}
