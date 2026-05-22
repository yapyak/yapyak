import type { CodeGroupBlock } from '@yapyak/doc-extractor';

import { CodeGroup } from '#components/code-group';

export interface BlockRendererNodeCodeGroupProps {
  block: CodeGroupBlock;
}

export function BlockRendererNodeCodeGroup(props: BlockRendererNodeCodeGroupProps) {
  const { block } = props;

  return (
    <CodeGroup
      tabs={block.tabs.map((tab) => ({
        label: tab.label ?? undefined,
        language: tab.language ?? undefined,
        source: tab.source,
      }))}
    />
  );
}
