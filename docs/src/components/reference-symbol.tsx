import type { HTMLAttributes, ReactElement, ReactNode } from 'react';

import styles from './reference-symbol.module.css';
import { ReferenceSymbolDeprecated } from './reference-symbol/deprecated';
import { ReferenceSymbolDescription } from './reference-symbol/description';
import { ReferenceSymbolExamples } from './reference-symbol/examples';
import { ReferenceSymbolHeader } from './reference-symbol/header';
import { ReferenceSymbolMemberTable } from './reference-symbol/member-table';
import { ReferenceSymbolReturns } from './reference-symbol/returns';
import { ReferenceSymbolSignature } from './reference-symbol/signature';
import { ReferenceSymbolSourceLink } from './reference-symbol/source-link';

export interface ReferenceSymbolProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

export function ReferenceSymbol(props: ReferenceSymbolProps): ReactElement {
  const { children, className, ...restProps } = props;
  const merged = className
    ? `${styles.ReferenceSymbol} ${className}`
    : styles.ReferenceSymbol;
  return (
    <article
      {...restProps}
      className={merged}
    >
      {children}
    </article>
  );
}

ReferenceSymbol.Header = ReferenceSymbolHeader;
ReferenceSymbol.Deprecated = ReferenceSymbolDeprecated;
ReferenceSymbol.Description = ReferenceSymbolDescription;
ReferenceSymbol.Signature = ReferenceSymbolSignature;
ReferenceSymbol.MemberTable = ReferenceSymbolMemberTable;
ReferenceSymbol.Returns = ReferenceSymbolReturns;
ReferenceSymbol.Examples = ReferenceSymbolExamples;
ReferenceSymbol.SourceLink = ReferenceSymbolSourceLink;
