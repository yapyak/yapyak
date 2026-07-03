import type { KindBadgeBlock } from '@yapyak/doc-compiler';

import { KindBadge } from '#components/kind-badge';

export type BlockRendererNodeKindBadgeProps = {
  block: KindBadgeBlock;
};

export function BlockRendererNodeKindBadge(
  props: BlockRendererNodeKindBadgeProps,
) {
  const { block } = props;

  return (
    <KindBadge
      appearance="plain"
      size="sm"
      variant={block.exportKind}
    />
  );
}
