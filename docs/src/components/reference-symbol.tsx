import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './reference-symbol.module.css';
import { ReferenceSymbolDeprecated } from './reference-symbol/deprecated';
import { ReferenceSymbolDescription } from './reference-symbol/description';
import { ReferenceSymbolExamples } from './reference-symbol/examples';
import { ReferenceSymbolHeader } from './reference-symbol/header';
import { ReferenceSymbolMemberTable } from './reference-symbol/member-table';
import { ReferenceSymbolReturns } from './reference-symbol/returns';
import { ReferenceSymbolSignature } from './reference-symbol/signature';
import { ReferenceSymbolSourceLink } from './reference-symbol/source-link';

export interface ReferenceSymbolProps extends BoxProps<'article'> {}

export function ReferenceSymbol(props: ReferenceSymbolProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="article"
      className={[styles.ReferenceSymbol, className]}
    />
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
