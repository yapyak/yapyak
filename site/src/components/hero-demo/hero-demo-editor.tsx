import type { ReactElement } from 'react';
import { tokenize } from '#lib/utils/tokenize';
import styles from './hero-demo-editor.module.css';

export interface HeroDemoEditorProps {
  source: string;
  saving: boolean;
  typing: boolean;
}

const CARET_MARKER = 'CARET';

export function HeroDemoEditor(props: HeroDemoEditorProps): ReactElement {
  const { source, saving, typing } = props;
  const code = buildCode(source);
  const tokens = tokenize(code, 'tsx');

  return (
    <div className={styles.HeroDemoEditor} data-saving={saving || undefined}>
      <div className={styles.Tabs}>
        <span className={styles.Tab} data-active="true">
          <span className={styles.TabFilename}>app.tsx</span>
          <span className={styles.TabDot} data-dirty={typing || undefined} />
        </span>
      </div>
      <pre className={styles.Pre}>
        <code className={styles.Code}>
          {tokens.map((token, index) => {
            if (token.type === 'tx-source' && token.value.includes(CARET_MARKER)) {
              const inner = token.value.slice(1, -1);
              const parts = inner.split(CARET_MARKER);
              const before = parts[0] ?? '';
              const after = parts[1] ?? '';
              return (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: stable per render
                  key={index}
                  className="tx-tx-source"
                >
                  <span>'</span>
                  {before}
                  <span
                    className={styles.Caret}
                    data-typing={typing || undefined}
                  />
                  {after}
                  <span>'</span>
                </span>
              );
            }
            return (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: stable per render
                key={index}
                className={`tx-${token.type}`}
              >
                {token.value}
              </span>
            );
          })}
        </code>
      </pre>
    </div>
  );
}

const T = 't';

function buildCode(source: string): string {
  const safe = source.replace(/'/g, "\\'");
  return `import { ${T} } from 'yapyak';

export function Welcome() {
  return <h1>{${T}('${safe}${CARET_MARKER}')}</h1>;
}
`;
}
