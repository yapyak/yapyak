import type { ButtonBaseProps } from '#primitives/button';

import { useEffect, useRef, useState } from 'react';
import { t } from 'yapyak';

import { Box } from '#primitives/box';
import { ButtonBase } from '#primitives/button';

import { Icon } from '../icon';
import styles from './code-block-copy-button.module.css';

export type CodeBlockCopyButtonProps = ButtonBaseProps & {
  source: string;
};

const RESET_DELAY_MS = 1500;

export function CodeBlockCopyButton(props: CodeBlockCopyButtonProps) {
  const { className, source, ...restProps } = props;

  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useRef<number>(undefined);

  useEffect(
    () => () => {
      if (timeoutRef.current !== undefined) {
        window.clearTimeout(timeoutRef.current);
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
    if (timeoutRef.current !== undefined) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
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
      data-copied={isCopied}
      onClick={handleClick}
    >
      <Box
        aria-hidden="true"
        className={styles.IconStack}
      >
        <Box className={styles.IconIdle}>
          <Icon
            name="copy"
            size="14"
          />
        </Box>
        <Box className={styles.IconCopied}>
          <Icon
            name="check"
            size="14"
          />
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
