import type { BoxProps } from '#components/box';
import type { LocaleCode } from '#utils/hero-demo-scenes';

import { Box } from '#components/box';
import { CodeBlockToken } from '#components/code-block-token';
import { LOCALES } from '#utils/hero-demo-scenes';

import { HeroDemoLocaleFlag } from './hero-demo-locale-flag';
import styles from './hero-demo-locale-stack.module.css';

export type HeroDemoLocaleStackProps = BoxProps & {
  receiving: boolean;
  savedSource: string;
  shimmering: Set<LocaleCode>;
  translations: Record<LocaleCode, string>;
};

export function HeroDemoLocaleStack(props: HeroDemoLocaleStackProps) {
  const {
    className,
    receiving,
    savedSource,
    shimmering,
    translations,
    ...restProps
  } = props;

  return (
    <Box
      {...restProps}
      className={[
        styles.HeroDemoLocaleStack,
        className,
      ]}
      data-receiving={receiving}
    >
      <Box
        aria-hidden="true"
        as="span"
        className={styles.FlashOverlay}
      />
      {LOCALES.map((locale) => {
        const value = translations[locale.code];
        const isShimmering = shimmering.has(locale.code);
        return (
          <Box
            className={styles.LocaleRow}
            key={locale.code}
          >
            <Box
              aria-hidden="true"
              as="span"
              className={styles.FlagIcon}
            >
              <HeroDemoLocaleFlag code={locale.code} />
            </Box>
            <Box
              as="span"
              className={styles.FilenameText}
            >
              {locale.filename}
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
      })}
    </Box>
  );
}
