import type { CodeGroupBlock } from '#lib/content';

import { CodeGroup } from '#components/code-group';

export interface BlockRendererNodeCodeGroupProps {
  block: CodeGroupBlock;
}

export function BlockRendererNodeCodeGroup(
  props: BlockRendererNodeCodeGroupProps,
) {
  const { block } = props;
  return (
    <CodeGroup
      blocks={block.tabs.map((tab) => ({
        label: tab.label ?? tab.language ?? 'Code',
        language: tab.language ?? undefined,
        source: tab.source,
      }))}
    />
  );
}
