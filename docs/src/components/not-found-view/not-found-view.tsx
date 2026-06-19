import { t } from 'yapyak';

import { Box } from '#components/box';

import styles from './not-found-view.module.css';

export function NotFoundView() {
  return (
    <Box
      as="section"
      className={styles.NotFoundView}
    >
      <Box className={styles.Stack}>
        <Box
          as="h1"
          className={styles.Heading}
        >
          404
        </Box>
        <Box
          as="p"
          className={styles.Subheading}
        >
          {t('Page not found')}
        </Box>
      </Box>
    </Box>
  );
}
