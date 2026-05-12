import type { ReactElement } from 'react';
import { type Lang, tokenize } from '#lib/utils/tokenize';

export interface CodeBlockProps {
  code: string;
  lang: Lang;
}

export function CodeBlock(props: CodeBlockProps): ReactElement {
  const { code, lang } = props;
  const tokens = tokenize(code, lang);
  return (
    <div className="CodeBlock" data-lang={lang}>
      <pre>
        <code>
          {tokens.map((token, index) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: tokens are stable per render
              key={index}
              className={`tx-${token.type}`}
            >
              {token.value}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
