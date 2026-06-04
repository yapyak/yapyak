import type { ChangeEvent } from 'react';
import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import { doc } from 'virtual:doc-extractor';

import styles from './options-selector.module.css';
import { useOptionsContext } from './options-context';

export interface OptionsSelectorsProps extends BoxProps {}

export function OptionsSelectors(props: OptionsSelectorsProps) {
  const { className, ...restProps } = props;
  const registry = doc.getOptions();
  const groupIds = Object.keys(registry);

  if (groupIds.length === 0) {
    return null;
  }

  return (
    <Box
      {...restProps}
      className={[styles.OptionsSelectors, className]}
    >
      {groupIds.map((groupId) => (
        <OptionsSelector
          groupId={groupId}
          key={groupId}
        />
      ))}
    </Box>
  );
}

interface OptionsSelectorProps {
  groupId: string;
}

function OptionsSelector(props: OptionsSelectorProps) {
  const { groupId } = props;
  const { get, set } = useOptionsContext();
  const group = doc.getOptionsGroup(groupId);
  if (group === null) {
    return null;
  }
  const active = get(groupId);

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    set(groupId, event.currentTarget.value);
  };

  return (
    <Box
      aria-label={group.label}
      as="select"
      className={styles.OptionsSelector}
      onChange={handleChange}
      value={active}
    >
      {group.options.map((option) => (
        <Box
          as="option"
          className={styles.Option}
          key={option.value}
          value={option.value}
        >
          {option.label}
        </Box>
      ))}
    </Box>
  );
}
