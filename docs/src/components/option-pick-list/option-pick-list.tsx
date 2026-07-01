import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';
import { ChevronIcon } from '#components/chevron-icon';
import { OptionAtom } from '#components/option-atom';
import { useOptionContext } from '#components/option-provider';
import { Popover, PopoverTrigger } from '#components/popover';

import styles from './option-pick-list.module.css';
import { OptionPickListItem } from './option-pick-list-item';
import { doc } from 'virtual:doc-compiler';

export type OptionPickListProps = BoxProps;

export function OptionPickList(props: OptionPickListProps) {
  const { className, ...restProps } = props;
  const registry = doc.getOptions();
  const { get, set } = useOptionContext();
  const groupIds = Object.keys(registry).filter(
    (groupId) => groupId !== 'adapter' && groupId !== 'translator',
  );

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
    <Box
      {...restProps}
      className={[
        styles.OptionPickList,
        className,
      ]}
    >
      <PopoverTrigger
        popover={(popoverProps) => (
          <Popover
            {...popoverProps}
            alignment="end"
            placement="bottom"
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
                      <OptionPickListItem
                        active={option.value === active}
                        groupId={groupId}
                        key={option.value}
                        onActivate={set}
                        option={option}
                      />
                    ))}
                  </Box>
                </Box>
              );
            })}
          </Popover>
        )}
      >
        {(triggerProps) => (
          <Box
            {...triggerProps}
            as="button"
            className={styles.Trigger}
            type="button"
          >
            <Box className={styles.AtomRow}>
              {triggerEntries.map((entry) => (
                <OptionAtom
                  key={entry.groupId}
                  label={entry.label}
                  value={entry.value}
                />
              ))}
            </Box>
            <ChevronIcon direction="down" />
          </Box>
        )}
      </PopoverTrigger>
    </Box>
  );
}
