import type { ButtonBaseProps } from '#primitives/button';

import { t } from 'yapyak';

import { ButtonBase } from '#primitives/button';

import { Icon } from '../icon';
import styles from './search-dialog-button.module.css';

export type SearchDialogButtonProps = ButtonBaseProps;

export function SearchDialogButton(props: SearchDialogButtonProps) {
  const { className, ...restProps } = props;

  return (
    <ButtonBase
      {...restProps}
      aria-label={t('Search')}
      className={[
        styles.SearchDialogButton,
        className,
      ]}
    >
      <Icon
        name="search"
        size="20"
      />
    </ButtonBase>
  );
}
