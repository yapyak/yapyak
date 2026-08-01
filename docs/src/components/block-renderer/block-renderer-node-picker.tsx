import type { PickerBlock } from '@yapyak/docs-compiler';
import type { BoxProps } from '#primitives/box';

import { visibleOptionsForGroup } from '#lib/adapter';
import { Box } from '#primitives/box';

import { useOptionContext } from '../option-provider';
import styles from './block-renderer-node-picker.module.css';
import { BlockRendererNodePickerOption } from './block-renderer-node-picker-option';
import { doc } from 'virtual:docs-compiler';

export type BlockRendererNodePickerProps = BoxProps<'section'> & {
  block: PickerBlock;
};

export function BlockRendererNodePicker(props: BlockRendererNodePickerProps) {
  const { block, className, ...restProps } = props;
  const { get, set } = useOptionContext();
  const group = doc.getOptionsGroup(block.group);
  const activeValue = get(block.group);

  if (group === undefined) {
    return null;
  }

  const options = visibleOptionsForGroup(
    block.group,
    group.options,
    get('framework'),
  );
  if (options.length < 2) {
    return null;
  }

  return (
    <Box
      {...restProps}
      as="section"
      className={[
        styles.BlockRendererNodePicker,
        className,
      ]}
    >
      <Box className={styles.Label}>{group.label}</Box>
      <Box
        aria-label={group.label}
        className={styles.Group}
        role="radiogroup"
      >
        {options.map((option) => (
          <BlockRendererNodePickerOption
            active={option.value === activeValue}
            groupId={block.group}
            key={option.value}
            label={option.label}
            onActivate={set}
            value={option.value}
          />
        ))}
      </Box>
    </Box>
  );
}
