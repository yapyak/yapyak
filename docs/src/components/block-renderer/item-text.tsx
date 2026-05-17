import type { TextBlock } from '#lib/content';

export interface ItemTextProps {
  block: TextBlock;
}

export function ItemText(props: ItemTextProps) {
  const { block } = props;
  return block.value;
}
