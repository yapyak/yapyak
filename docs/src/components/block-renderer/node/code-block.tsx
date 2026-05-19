import type { CodeBlock as CodeBlockData } from '#lib/content';

import { CodeBlock } from '#components/code-block';

export interface NodeCodeBlockProps {
  block: CodeBlockData;
}

export function NodeCodeBlock(props: NodeCodeBlockProps) {
  const { block } = props;
  return (
    <CodeBlock
      label={block.label ?? undefined}
      language={block.language ?? undefined}
      source={block.source}
    />
  );
}
