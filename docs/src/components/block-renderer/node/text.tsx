import type { TextBlock } from '#lib/content';

export interface BlockRendererNodeTextProps {
  block: TextBlock;
}

export function BlockRendererNodeText(props: BlockRendererNodeTextProps) {
  const { block } = props;
  return block.value;
}
