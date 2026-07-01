import type { ReactNode } from 'react';
import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import styles from './page-action.module.css';

export type PageActionLinkProps = BoxProps<'a'> & {
  href: string;
  icon: ReactNode;
  label: string;
};

export function PageActionLink(props: PageActionLinkProps) {
  const { className, href, icon, label, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="a"
      className={[
        styles.PageActionLink,
        className,
      ]}
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      <Box
        as="span"
        className={styles.LeadingIcon}
      >
        {icon}
      </Box>
      <Box
        as="span"
        className={styles.Label}
      >
        {label}
      </Box>
    </Box>
  );
}
