import type { ButtonBaseProps } from '#primitives/button';

import { t } from 'yapyak';

import { Icon } from '#components/icon';
import { Box } from '#primitives/box';
import { ButtonBase } from '#primitives/button';

import styles from './command-palette-button.module.css';

export type CommandPaletteButtonProps = ButtonBaseProps;

export function CommandPaletteButton(props: CommandPaletteButtonProps) {
  const { className, ...restProps } = props;

  return (
    <ButtonBase
      {...restProps}
      className={[
        styles.CommandPaletteButton,
        className,
      ]}
    >
      <Icon
        className={styles.SearchIcon}
        name="search"
      />
      <Box
        as="span"
        className={styles.Label}
      >
        {t('Search')}
      </Box>
      <Box
        aria-hidden={true}
        as="span"
        className={styles.ShortcutText}
      >
        ⌘K
      </Box>
    </ButtonBase>
  );
}
