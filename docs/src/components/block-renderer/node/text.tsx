import type { TextBlock } from '#lib/content';

export interface NodeTextProps {
  block: TextBlock;
}

export function NodeText(props: NodeTextProps) {
  const { block } = props;
  return block.value;
}
