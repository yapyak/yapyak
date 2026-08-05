import type { BoxProps } from '#primitives/box';

import { t } from 'yapyak';

import { Box } from '#primitives/box';

import styles from './search-empty-message.module.css';

export type SearchEmptyMessageProps = BoxProps;

export function SearchEmptyMessage(props: SearchEmptyMessageProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      className={[
        styles.SearchEmptyMessage,
        className,
      ]}
    >
      {t('No results found')}
    </Box>
  );
}
