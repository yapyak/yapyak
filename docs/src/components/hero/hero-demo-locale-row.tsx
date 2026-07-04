import type { LocaleCode } from '#lib/hero-demo';

import { CodeBlockToken } from '#components/code-block-token';
import { Box } from '#primitives/box';

import { HeroDemoLocaleFlag } from './hero-demo-locale-flag';
import styles from './hero-demo-locale-stack.module.css';

export type HeroDemoLocaleRowProps = {
  filename: string;
  localeCode: LocaleCode;
  savedSource: string;
  shimmering: boolean;
  value: string | undefined;
};

export function HeroDemoLocaleRow(props: HeroDemoLocaleRowProps) {
  const {
    filename,
    localeCode,
    savedSource,
    shimmering: isShimmering,
    value,
  } = props;

  return (
    <Box className={styles.LocaleRow}>
      <Box
        aria-hidden="true"
        as="span"
        className={styles.FlagIcon}
      >
        <HeroDemoLocaleFlag code={localeCode} />
      </Box>
      <Box
        as="span"
        className={styles.FilenameText}
      >
        {filename}
      </Box>
      <Box
        as="span"
        className={styles.JsonText}
      >
        <Box
          as="span"
          className={styles.JsonOpening}
        >
          <CodeBlockToken kind="punct">{'{'}</CodeBlockToken>
          <Box
            as="span"
            className={styles.KeyText}
            key={savedSource}
          >
            <CodeBlockToken kind="string">
              <Box as="span">"</Box>
              {savedSource}
              <Box as="span">"</Box>
            </CodeBlockToken>
          </Box>
          <CodeBlockToken kind="punct">:</CodeBlockToken>
        </Box>
        {isShimmering || !value ? (
          <Box
            aria-hidden="true"
            as="span"
            className={styles.Skeleton}
          />
        ) : (
          <Box
            as="span"
            className={styles.ValueText}
            key={value}
          >
            <CodeBlockToken kind="tx-source">
              <Box as="span">"</Box>
              {value}
              <Box as="span">"</Box>
            </CodeBlockToken>
          </Box>
        )}
        <Box
          as="span"
          className={styles.JsonClosing}
        >
          <CodeBlockToken kind="punct">{'}'}</CodeBlockToken>
        </Box>
      </Box>
    </Box>
  );
}
