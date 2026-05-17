import type { CodeBlock as CodeBlockData } from '#lib/content';

import { CodeBlock } from '#components/code-block';

export interface BlockRendererNodeCodeBlockProps {
  block: CodeBlockData;
}

export function BlockRendererNodeCodeBlock(
  props: BlockRendererNodeCodeBlockProps,
) {
  const { block } = props;
  return (
    <CodeBlock
      language={block.language ?? undefined}
      source={block.source}
    />
  );
}
