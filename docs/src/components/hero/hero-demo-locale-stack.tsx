import type { LocaleCode } from '#lib/hero-demo';
import type { BoxProps } from '#primitives/box';

import { LOCALES } from '#lib/hero-demo';
import { Box } from '#primitives/box';

import { HeroDemoLocaleRow } from './hero-demo-locale-row';
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
      {LOCALES.map((locale) => (
        <HeroDemoLocaleRow
          filename={locale.filename}
          isShimmering={shimmering.has(locale.code)}
          key={locale.code}
          localeCode={locale.code}
          savedSource={savedSource}
          value={translations[locale.code]}
        />
      ))}
    </Box>
  );
}
