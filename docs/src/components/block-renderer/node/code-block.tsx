import type { CodeBlock as CodeBlockData } from '#lib/content';

import { CodeBlock } from '#components/code-block';

export interface NodeCodeBlockProps {
  block: CodeBlockData;
}

export function NodeCodeBlock(
  props: NodeCodeBlockProps,
) {
  const { block } = props;
  return (
    <CodeBlock
      language={block.language}
      source={block.source}
    />
  );
}
