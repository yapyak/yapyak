import type { ReactElement } from 'react';
import styles from './feature-block.module.css';

export interface FeatureBlockProps {
  title: string;
  description: string;
  codeHtml: string;
  reverse?: boolean;
}

export function FeatureBlock(props: FeatureBlockProps): ReactElement {
  const { title, description, codeHtml, reverse = false } = props;
  return (
    <section
      className={styles.FeatureBlock}
      data-reverse={reverse ? '' : undefined}
    >
      <div className={styles.Stack}>
        <h2 className={styles.Title}>{title}</h2>
        <p className={styles.Description}>{description}</p>
      </div>
      <div
        className={styles.Code}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: pre-rendered server-side via shiki
        dangerouslySetInnerHTML={{ __html: codeHtml }}
      />
    </section>
  );
}
