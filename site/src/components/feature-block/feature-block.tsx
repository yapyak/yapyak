import type { ReactElement } from 'react';
import { CodeBlock } from '#components/code-block';
import type { Lang } from '#lib/utils/tokenize';
import styles from './feature-block.module.css';

export interface FeatureBlockProps {
  title: string;
  description: string;
  code: string;
  lang: Lang;
  reverse?: boolean;
}

export function FeatureBlock(props: FeatureBlockProps): ReactElement {
  const { title, description, code, lang, reverse = false } = props;
  return (
    <section
      className={styles.FeatureBlock}
      data-reverse={reverse ? '' : undefined}
    >
      <div className={styles.Stack}>
        <h2 className={styles.Title}>{title}</h2>
        <p className={styles.Description}>{description}</p>
      </div>
      <CodeBlock code={code} lang={lang} />
    </section>
  );
}
