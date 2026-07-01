import type { ButtonBaseProps } from '#primitives/button';

import { useEffect, useRef, useState } from 'react';
import { t } from 'yapyak';

import { CheckIcon } from '#components/check-icon';
import { CopyIcon } from '#components/copy-icon';
import { Box } from '#primitives/box';
import { ButtonBase } from '#primitives/button';

import styles from './code-block-copy-button.module.css';

export type CodeBlockCopyButtonProps = ButtonBaseProps & {
  source: string;
};

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

  const handleClick = async () => {
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
    <ButtonBase
      {...restProps}
      aria-label={t('Copy code')}
      className={[
        styles.CodeBlockCopyButton,
        className,
      ]}
      data-copied={isCopied ? '' : undefined}
      onClick={handleClick}
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
    </ButtonBase>
  );
}
