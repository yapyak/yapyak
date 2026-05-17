import type { CodeBlock as CodeBlockData } from '#lib/content';

import { CodeBlock } from '#components/code-block';

export interface ItemCodeBlockProps {
  block: CodeBlockData;
}

export function ItemCodeBlock(props: ItemCodeBlockProps) {
  const { block } = props;
  return (
    <CodeBlock
      language={block.language ?? undefined}
      source={block.source}
    />
  );
}
