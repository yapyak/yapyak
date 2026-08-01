import type { CodeBlock as CodeBlockData } from '@yapyak/docs-compiler';

import { CodeBlock } from '../code-block';

export type BlockRendererNodeCodeBlockProps = {
  block: CodeBlockData;
};

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
