import type { LinkBlock } from '@yapyak/docs-compiler';
import type { BoxProps } from '#primitives/box';

import { LinkBase } from '#primitives/link';

import { ExternalLink } from '../external-link';
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

  const isInlineCode =
    block.children.length === 1 && block.children[0]?.kind === 'inline-code';

  if (block.linkKind === 'internal') {
    return (
      <LinkBase
        className={[
          styles.BlockRendererNodeLink,
          className,
        ]}
        data-inline-code={isInlineCode}
        to={block.href}
      >
        {children}
      </LinkBase>
    );
  }

  return <ExternalLink href={block.href}>{children}</ExternalLink>;
}
