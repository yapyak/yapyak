import type { CodeBlock as CodeBlockData } from '@yapyak/doc-extractor';

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
      label={block.label ?? undefined}
      language={block.language ?? undefined}
      path={block.path ?? undefined}
      source={block.source}
    />
  );
}
