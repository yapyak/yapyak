import type { CodeGroupBlock } from '#lib/content';

import { CodeGroup } from '#components/code-group';

export interface NodeCodeGroupProps {
  block: CodeGroupBlock;
}

export function NodeCodeGroup(props: NodeCodeGroupProps) {
  const { block } = props;

  return <CodeGroup tabs={block.tabs} />;
}
