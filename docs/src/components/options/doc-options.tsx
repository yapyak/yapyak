import { useId } from 'react';

import { Box } from '#components/box';
import { CheckIcon } from '#components/check-icon';
import { ChevronIcon } from '#components/chevron-icon';
import { FrameworkIcon } from '#components/framework-icon';
import { PackageManagerIcon } from '#components/package-manager-icon';

import styles from './doc-options.module.css';
import { useOptionsContext } from './options-context';
import { doc } from 'virtual:doc-extractor';

const PRIMARY_GROUP_ID = 'framework';
const PACKAGE_MANAGER_GROUP_ID = 'packageManager';

export type DocOptionsProps = {};

export function DocOptions(_props: DocOptionsProps) {
  const registry = doc.getOptions();
  const { get, set } = useOptionsContext();
  const popoverId = useId();
  const groupIds = Object.keys(registry);

  if (groupIds.length === 0) {
    return null;
  }

  const primaryGroup = registry[PRIMARY_GROUP_ID];
  const primaryValue = primaryGroup ? get(PRIMARY_GROUP_ID) : '';
  const primaryLabel =
    primaryGroup?.options.find((option) => option.value === primaryValue)
      ?.label ?? '';

  return (
    <>
      <Box
        as="button"
        className={styles.Trigger}
        popoverTarget={popoverId}
        type="button"
      >
        <FrameworkIcon name={primaryValue} />
        <Box
          as="span"
          className={styles.TriggerLabel}
        >
          {primaryLabel}
        </Box>
        <ChevronIcon direction="down" />
      </Box>
      <Box
        className={styles.Popover}
        id={popoverId}
        popover="auto"
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
                    className={styles.Option}
                    data-active={option.value === active}
                    key={option.value}
                    onClick={() => set(groupId, option.value)}
                    type="button"
                  >
                    {groupId === PRIMARY_GROUP_ID && (
                      <FrameworkIcon name={option.value} />
                    )}
                    {groupId === PACKAGE_MANAGER_GROUP_ID && (
                      <PackageManagerIcon name={option.value} />
                    )}
                    <Box
                      as="span"
                      className={styles.OptionLabel}
                    >
                      {option.label}
                    </Box>
                    {option.value === active && (
                      <Box
                        as="span"
                        className={styles.OptionCheck}
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
      </Box>
    </>
  );
}
