import type { SwitchBlock } from '@yapyak/doc-compiler';
import type { BoxProps } from '#components/box';

import { Box } from '#components/box';
import { useOptionContext } from '#components/option-provider';

import { BlockRenderer } from './block-renderer';
import { doc } from 'virtual:doc-compiler';

export type BlockRendererNodeSwitchProps = BoxProps & {
  block: SwitchBlock;
};

export function BlockRendererNodeSwitch(props: BlockRendererNodeSwitchProps) {
  const { block, className, ...restProps } = props;
  const { get } = useOptionContext();
  const group = doc.getOptionsGroup(block.group);
  if (group === undefined) {
    return null;
  }
  const active = get(block.group);

  return (
    <Box data-switch-group={block.group}>
      {group.options.map((option) => {
        const branchBlocks =
          block.branches[option.value] ?? block.fallback ?? [];
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
