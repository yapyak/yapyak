import type { ReactElement } from 'react';
import { LOCALES, type LocaleCode } from './scenes';
import styles from './hero-demo-locales.module.css';

export interface HeroDemoLocalesProps {
  source: string;
  translations: Record<LocaleCode, string>;
  shimmering: Set<LocaleCode>;
}

export function HeroDemoLocales(props: HeroDemoLocalesProps): ReactElement {
  const { source, translations, shimmering } = props;
  return (
    <div className={styles.HeroDemoLocales}>
      {LOCALES.map((locale) => {
        const value = translations[locale.code];
        const isShimmering = shimmering.has(locale.code);
        return (
          <div
            key={locale.code}
            className={styles.LocaleRow}
            data-shimmering={isShimmering || undefined}
          >
            <span className={styles.Flag} aria-hidden="true">
              {locale.flag}
            </span>
            <span className={styles.Filename}>{locale.filename}</span>
            <span className={styles.Json}>
              <span className="tx-punct">{'{ '}</span>
              <span className="tx-tx-source">
                <span>"</span>
                {source}
                <span>"</span>
              </span>
              <span className="tx-punct">: </span>
              <span className="tx-string">
                <span>"</span>
                {value}
                <span>"</span>
              </span>
              <span className="tx-punct">{' }'}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
