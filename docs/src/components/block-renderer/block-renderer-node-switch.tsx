import type { SwitchBlock } from '@yapyak/doc-compiler';
import type { BoxProps } from '#primitives/box';

import { useOptionContext } from '#components/option-provider';
import { Box } from '#primitives/box';

import { BlockRendererNodeSwitchBranch } from './block-renderer-node-switch-branch';
import { doc } from 'virtual:doc-compiler';

export type BlockRendererNodeSwitchProps = BoxProps & {
  block: SwitchBlock;
};

export function BlockRendererNodeSwitch(props: BlockRendererNodeSwitchProps) {
  const { block } = props;
  const { get } = useOptionContext();
  const group = doc.getOptionsGroup(block.group);
  if (group === undefined) {
    return null;
  }
  const activeValue = get(block.group);

  return (
    <Box data-switch-group={block.group}>
      {group.options.map((option) => (
        <BlockRendererNodeSwitchBranch
          blocks={block.branches[option.value] ?? block.fallback ?? []}
          key={option.value}
          value={option.value}
          visible={option.value === activeValue}
        />
      ))}
    </Box>
  );
}
