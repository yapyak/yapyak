import type { TextBlock } from '@yapyak/doc-extractor';

export interface BlockRendererNodeTextProps {
  block: TextBlock;
}

export function BlockRendererNodeText(props: BlockRendererNodeTextProps) {
  const { block } = props;
  return block.value;
}
