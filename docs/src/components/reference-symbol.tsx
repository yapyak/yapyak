import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import { ReferenceSymbolDeprecated } from './reference-symbol/deprecated';
import { ReferenceSymbolDescription } from './reference-symbol/description';
import { ReferenceSymbolExampleList } from './reference-symbol/example-list';
import { ReferenceSymbolHeader } from './reference-symbol/header';
import { ReferenceSymbolMemberTable } from './reference-symbol/member-table';
import { ReferenceSymbolReturnSection } from './reference-symbol/return-section';
import { ReferenceSymbolSignature } from './reference-symbol/signature';
import { ReferenceSymbolSourceLink } from './reference-symbol/source-link';
import styles from './reference-symbol.module.css';

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
ReferenceSymbol.Returns = ReferenceSymbolReturnSection;
ReferenceSymbol.Examples = ReferenceSymbolExampleList;
ReferenceSymbol.SourceLink = ReferenceSymbolSourceLink;
