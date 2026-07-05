import { Box } from '#primitives/box';

import styles from './status-view.module.css';

export type StatusViewProps = {
  code: string;
  message: string;
};

export function StatusView(props: StatusViewProps) {
  const { code, message } = props;

  return (
    <Box
      as="section"
      className={styles.StatusView}
    >
      <Box
        as="h1"
        className={styles.Heading}
      >
        {code}
      </Box>
      <Box
        as="p"
        className={styles.Subheading}
      >
        {message}
      </Box>
    </Box>
  );
}
