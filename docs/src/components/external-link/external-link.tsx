import type { BoxProps } from '#primitives/box';

import { ExternalLinkIcon } from '#components/external-link-icon';
import { Box } from '#primitives/box';

import styles from './external-link.module.css';

export type ExternalLinkSize = 'lg' | 'md' | 'sm';

export type ExternalLinkProps = BoxProps<'a'> & {
  size?: ExternalLinkSize;
};

const ICON_SIZE: Record<ExternalLinkSize, number> = {
  lg: 16,
  md: 14,
  sm: 11,
};

export function ExternalLink(props: ExternalLinkProps) {
  const { children, className, size = 'md', ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="a"
      className={[
        styles.ExternalLink,
        className,
      ]}
      data-size={size}
      rel="noreferrer"
      target="_blank"
    >
      {children}
      <Box
        aria-hidden="true"
        as="span"
        className={styles.Icon}
      >
        <ExternalLinkIcon size={ICON_SIZE[size]} />
      </Box>
    </Box>
  );
}
