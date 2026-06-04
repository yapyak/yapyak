import type { SwitchBlock } from '@yapyak/doc-extractor';

import { Box } from '#components/box';
import { useOptionsContext } from '#components/options';

import { BlockRenderer } from './block-renderer';
import { doc } from 'virtual:doc-extractor';

export interface BlockRendererNodeSwitchProps {
  block: SwitchBlock;
}

export function BlockRendererNodeSwitch(props: BlockRendererNodeSwitchProps) {
  const { block } = props;
  const { get } = useOptionsContext();
  const group = doc.getOptionsGroup(block.group);
  if (group === null) {
    return null;
  }
  const active = get(block.group);

  return (
    <Box data-switch-group={block.group}>
      {group.options.map((option) => {
        const branchBlocks = block.branches[option.value] ?? [];
        const visible = option.value === active;
        return (
          <Box
            data-when-value={option.value}
            hidden={!visible}
            key={option.value}
          >
            <BlockRenderer blocks={branchBlocks} />
          </Box>
        );
      })}
    </Box>
  );
}
