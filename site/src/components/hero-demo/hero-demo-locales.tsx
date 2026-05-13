import type { ReactElement } from 'react';
import { LOCALES, type LocaleCode } from './scenes';
import styles from './hero-demo-locales.module.css';

export interface HeroDemoLocalesProps {
  savedSource: string;
  translations: Record<LocaleCode, string>;
  shimmering: Set<LocaleCode>;
}

export function HeroDemoLocales(props: HeroDemoLocalesProps): ReactElement {
  const { savedSource, translations, shimmering } = props;
  return (
    <div className={styles.HeroDemoLocales}>
      {LOCALES.map((locale) => {
        const value = translations[locale.code];
        const isShimmering = shimmering.has(locale.code);
        return (
          <div key={locale.code} className={styles.LocaleRow}>
            <span className={styles.Flag} aria-hidden="true">
              {locale.flag}
            </span>
            <span className={styles.Filename}>{locale.filename}</span>
            <span className={styles.Json}>
              <span className="tx-punct">{'{ '}</span>
              <span key={savedSource} className={styles.Key}>
                <span className="tx-tx-source">
                  <span>"</span>
                  {savedSource}
                  <span>"</span>
                </span>
              </span>
              <span className="tx-punct">: </span>
              {isShimmering || value === '' ? (
                <span className={styles.Skeleton} aria-hidden="true" />
              ) : (
                <span key={value} className={styles.Value}>
                  <span className="tx-string">
                    <span>"</span>
                    {value}
                    <span>"</span>
                  </span>
                </span>
              )}
              <span className="tx-punct">{' }'}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
