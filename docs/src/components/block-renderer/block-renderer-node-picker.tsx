import type { PickerBlock } from '@yapyak/doc-compiler';

import { Box } from '#components/box';
import { useOptionsContext } from '#components/options';

import styles from './block-renderer-node-picker.module.css';
import { doc } from 'virtual:doc-compiler';

export type BlockRendererNodePickerProps = {
  block: PickerBlock;
};

export function BlockRendererNodePicker(props: BlockRendererNodePickerProps) {
  const { block } = props;
  const { get, set } = useOptionsContext();
  const group = doc.getOptionsGroup(block.group);
  const active = get(block.group);

  if (group === undefined) {
    return null;
  }

  return (
    <Box
      as="section"
      className={styles.Picker}
    >
      <Box className={styles.Label}>{group.label}</Box>
      <Box
        aria-label={group.label}
        className={styles.Group}
        role="radiogroup"
      >
        {group.options.map((option) => (
          <Box
            aria-checked={option.value === active}
            as="button"
            className={styles.Option}
            data-active={option.value === active}
            key={option.value}
            onClick={() => set(block.group, option.value)}
            role="radio"
            type="button"
          >
            {option.label}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
