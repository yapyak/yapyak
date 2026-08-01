import type { ButtonBaseProps } from '#primitives/button';

import { t } from 'yapyak';

import { Box } from '#primitives/box';
import { ButtonBase } from '#primitives/button';

import { Icon } from '../icon';
import styles from './search-dialog-button.module.css';

export type SearchDialogButtonVariant = 'default' | 'icon';

export type SearchDialogButtonProps = ButtonBaseProps & {
  variant?: SearchDialogButtonVariant;
};

export function SearchDialogButton(props: SearchDialogButtonProps) {
  const { className, variant = 'default', ...restProps } = props;
  const isIcon = variant === 'icon';

  return (
    <ButtonBase
      {...restProps}
      aria-label={isIcon ? t('Search') : undefined}
      className={[
        styles.SearchDialogButton,
        className,
      ]}
      data-variant={variant}
    >
      <Icon
        className={styles.SearchIcon}
        name="search"
        size={isIcon ? '20' : undefined}
      />
      {!isIcon && (
        <>
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
        </>
      )}
    </ButtonBase>
  );
}
