import type { CodeGroupBlock } from '#lib/content';

import { CodeGroup } from '#components/code-group';

export interface NodeCodeGroupProps {
  block: CodeGroupBlock;
}

export function NodeCodeGroup(
  props: NodeCodeGroupProps,
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
