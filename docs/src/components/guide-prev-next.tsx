import type { BoxProps } from '#components/box';
import type { GuideAdjacent } from '#lib/guide';

import { Link } from '@tanstack/react-router';
import { t } from 'yapyak';

import { Box } from '#components/box';

import styles from './guide-prev-next.module.css';

export interface GuidePrevNextProps extends BoxProps<'nav'> {
  next: GuideAdjacent | null;
  previous: GuideAdjacent | null;
}

export function GuidePrevNext(props: GuidePrevNextProps) {
  const { className, next, previous, ...restProps } = props;

  if (!next && !previous) {
    return null;
  }

  return (
    <Box
      {...restProps}
      as="nav"
      className={[styles.GuidePrevNext, className]}
    >
      {previous ? (
        <Link
          className={styles.PreviousCard}
          to={previous.href}
        >
          <Box
            as="span"
            className={styles.LabelText}
          >
            {t('Previous')}
          </Box>
          <Box
            as="span"
            className={styles.TitleText}
          >
            {previous.title}
          </Box>
        </Link>
      ) : (
        <Box className={styles.Spacer} />
      )}
      {next ? (
        <Link
          className={styles.NextCard}
          to={next.href}
        >
          <Box
            as="span"
            className={styles.LabelText}
          >
            {t('Next')}
          </Box>
          <Box
            as="span"
            className={styles.TitleText}
          >
            {next.title}
          </Box>
        </Link>
      ) : (
        <Box className={styles.Spacer} />
      )}
    </Box>
  );
}
