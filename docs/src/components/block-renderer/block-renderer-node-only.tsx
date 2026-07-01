import type { OnlyBlock } from '@yapyak/doc-compiler';

import { useOptionContext } from '#components/option-provider';

import { BlockRendererNode } from './block-renderer-node';

export type BlockRendererNodeOnlyProps = {
  block: OnlyBlock;
};

export function BlockRendererNodeOnly(props: BlockRendererNodeOnlyProps) {
  const { block } = props;
  const { get } = useOptionContext();

  if (get(block.group) !== block.value) {
    return null;
  }

  return (
    <>
      {block.children.map((child, index) => (
        <BlockRendererNode
          block={child}
          key={index}
        />
      ))}
    </>
  );
}
