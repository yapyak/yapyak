import type { BoxProps } from '#components/box';

import { useEffect, useRef, useState } from 'react';
import { t } from 'yapyak';

import { Box } from '#components/box';
import { CheckIcon } from '#components/check-icon';
import { CopyIcon } from '#components/copy-icon';

import styles from './code-block-copy-button.module.css';

export interface CodeBlockCopyButtonProps extends BoxProps<'button'> {
  source: string;
}

const RESET_DELAY_MS = 1500;

export function CodeBlockCopyButton(props: CodeBlockCopyButtonProps) {
  const { className, source, ...restProps } = props;

  const [isCopied, setIsCopied] = useState(false);
  const resetTimerRef = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      if (resetTimerRef.current !== undefined) {
        window.clearTimeout(resetTimerRef.current);
      }
    },
    [],
  );

  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(source);
    } catch {
      return;
    }
    setIsCopied(true);
    if (resetTimerRef.current !== undefined) {
      window.clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = window.setTimeout(() => {
      setIsCopied(false);
    }, RESET_DELAY_MS);
  };

  return (
    <Box
      {...restProps}
      aria-label={t('Copy code')}
      as="button"
      className={[
        styles.CodeBlockCopyButton,
        className,
      ]}
      data-copied={isCopied ? '' : undefined}
      onClick={onClick}
      type="button"
    >
      <Box
        aria-hidden="true"
        className={styles.IconStack}
      >
        <Box className={styles.IconIdle}>
          <CopyIcon />
        </Box>
        <Box className={styles.IconCopied}>
          <CheckIcon />
        </Box>
      </Box>
      <Box
        aria-live="polite"
        className={styles.LiveRegion}
        role="status"
      >
        {isCopied ? t('Copied') : ''}
      </Box>
    </Box>
  );
}
