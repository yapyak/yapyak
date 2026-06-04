import type { ChangeEvent } from 'react';
import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import { useOptionsContext } from './options-context';
import styles from './options-selector.module.css';
import { doc } from 'virtual:doc-extractor';

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
  const activeOption = group.options.find((option) => option.value === active);
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    set(groupId, event.currentTarget.value);
  };

  return (
    <Box
      aria-label={group.label}
      className={styles.OptionsSelector}
    >
      {activeOption?.icon ? (
        <Box
          alt=""
          as="img"
          className={styles.Icon}
          src={activeOption.icon}
        />
      ) : null}
      <Box
        as="span"
        className={styles.Label}
      >
        {activeOption?.label ?? group.label}
      </Box>
      <CaretIcon className={styles.Caret} />
      <Box
        aria-label={group.label}
        as="select"
        className={styles.NativeSelect}
        onChange={handleChange}
        value={active}
      >
        {group.options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </Box>
    </Box>
  );
}

interface CaretIconProps {
  className?: string;
}

function CaretIcon(props: CaretIconProps) {
  const { className } = props;
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
