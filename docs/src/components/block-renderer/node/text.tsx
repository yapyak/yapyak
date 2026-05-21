import type { TextBlock } from '@yapyak/doc-extractor';

export interface NodeTextProps {
  block: TextBlock;
}

export function NodeText(props: NodeTextProps) {
  const { block } = props;
  return block.value;
}
