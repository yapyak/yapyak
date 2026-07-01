import type { SwitchBlock } from '@yapyak/doc-compiler';
import type { BoxProps } from '#primitives/box';

import { useOptionContext } from '#components/option-provider';
import { Box } from '#primitives/box';

import { BlockRenderer } from './block-renderer';
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
      {group.options.map((option) => {
        const branchBlocks =
          block.branches[option.value] ?? block.fallback ?? [];
        const isVisible = option.value === activeValue;
        return (
          <Box
            data-when-value={option.value}
            hidden={!isVisible}
            key={option.value}
          >
            <BlockRenderer blocks={branchBlocks} />
          </Box>
        );
      })}
    </Box>
  );
}
