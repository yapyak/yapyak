import type { PickerBlock } from '@yapyak/doc-compiler';
import type { BoxProps } from '#primitives/box';

import { OptionDot } from '#components/option-dot';
import { useOptionContext } from '#components/option-provider';
import { Box } from '#primitives/box';
import { ButtonBase } from '#primitives/button';

import { visibleOptionsForGroup } from '../../adapter';
import styles from './block-renderer-node-picker.module.css';
import { doc } from 'virtual:doc-compiler';

export type BlockRendererNodePickerProps = BoxProps<'section'> & {
  block: PickerBlock;
};

export function BlockRendererNodePicker(props: BlockRendererNodePickerProps) {
  const { block, className, ...restProps } = props;
  const { get, set } = useOptionContext();
  const group = doc.getOptionsGroup(block.group);
  const active = get(block.group);

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
        styles.Picker,
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
          <ButtonBase
            aria-checked={option.value === active}
            className={styles.Option}
            data-active={option.value === active}
            data-option-value={option.value}
            key={option.value}
            onClick={() => set(block.group, option.value)}
            role="radio"
          >
            <OptionDot />
            {option.label}
          </ButtonBase>
        ))}
      </Box>
    </Box>
  );
}
