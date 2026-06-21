import { useId } from 'react';

import { Box } from '#components/box';
import { CheckIcon } from '#components/check-icon';
import { ChevronIcon } from '#components/chevron-icon';
import { OptionDot } from '#components/option-dot';
import { Popover } from '#components/popover';
import popoverStyles from '#components/popover/popover.module.css';

import styles from './doc-options.module.css';
import { useOptionsContext } from './options-context';
import { doc } from 'virtual:doc-compiler';

export type DocOptionsProps = {};

export function DocOptions(_props: DocOptionsProps) {
  const registry = doc.getOptions();
  const { get, set } = useOptionsContext();
  const popoverId = useId();
  const anchorName = `--anchor${popoverId.replace(/[^a-z0-9-]/gi, '-')}`;
  const groupIds = Object.keys(registry);

  if (groupIds.length === 0) {
    return null;
  }

  const triggerEntries = groupIds.flatMap((groupId) => {
    const group = registry[groupId];
    if (!group) {
      return [];
    }
    const value = get(groupId);
    const label = group.options.find((option) => option.value === value)?.label;
    if (label === undefined) {
      return [];
    }
    return [
      {
        groupId,
        label,
        value,
      },
    ];
  });

  return (
    <>
      <Box
        as="button"
        className={styles.Trigger}
        popoverTarget={popoverId}
        style={{
          '--trigger-anchor': anchorName,
        }}
        type="button"
      >
        {triggerEntries.map((entry) => (
          <Box
            as="span"
            className={styles.TriggerEntry}
            data-option-value={entry.value}
            key={entry.groupId}
          >
            <OptionDot />
            <Box
              as="span"
              className={styles.TriggerLabel}
            >
              {entry.label}
            </Box>
          </Box>
        ))}
        <ChevronIcon direction="down" />
      </Box>
      <Popover
        align="center"
        anchorName={anchorName}
        id={popoverId}
      >
        {groupIds.map((groupId) => {
          const group = registry[groupId];
          if (!group) {
            return null;
          }
          const active = get(groupId);
          return (
            <Box
              className={styles.Group}
              key={groupId}
            >
              <Box className={styles.GroupLabel}>{group.label}</Box>
              <Box className={styles.GroupOptions}>
                {group.options.map((option) => (
                  <Box
                    aria-pressed={option.value === active}
                    as="button"
                    className={popoverStyles.Option}
                    data-active={option.value === active}
                    data-option-value={option.value}
                    key={option.value}
                    onClick={() => set(groupId, option.value)}
                    type="button"
                  >
                    <OptionDot />
                    <Box
                      as="span"
                      className={popoverStyles.OptionLabel}
                    >
                      {option.label}
                    </Box>
                    {option.value === active && (
                      <Box
                        as="span"
                        className={popoverStyles.OptionTrailing}
                      >
                        <CheckIcon />
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          );
        })}
      </Popover>
    </>
  );
}
