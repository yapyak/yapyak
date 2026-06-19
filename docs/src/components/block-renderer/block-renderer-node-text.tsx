import type { TextBlock } from '@yapyak/doc-compiler';

export type BlockRendererNodeTextProps = {
  block: TextBlock;
};

export function BlockRendererNodeText(props: BlockRendererNodeTextProps) {
  const { block } = props;
  return block.value;
}
