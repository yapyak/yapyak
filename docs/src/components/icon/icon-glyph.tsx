import type { ReactElement } from 'react';

import { IconGlyphChat } from './icon-glyph-chat';
import { IconGlyphCheck } from './icon-glyph-check';
import { IconGlyphChevron } from './icon-glyph-chevron';
import { IconGlyphCopy } from './icon-glyph-copy';
import { IconGlyphCross } from './icon-glyph-cross';
import { IconGlyphExternalLink } from './icon-glyph-external-link';
import { IconGlyphGithub } from './icon-glyph-github';
import { IconGlyphHash } from './icon-glyph-hash';
import { IconGlyphMarkdown } from './icon-glyph-markdown';
import { IconGlyphMenu } from './icon-glyph-menu';
import { IconGlyphPage } from './icon-glyph-page';
import { IconGlyphSearch } from './icon-glyph-search';
import { IconGlyphX } from './icon-glyph-x';

export type IconName =
  | 'chat'
  | 'check'
  | 'chevron'
  | 'copy'
  | 'cross'
  | 'external-link'
  | 'github'
  | 'hash'
  | 'markdown'
  | 'menu'
  | 'page'
  | 'search'
  | 'x';

export type IconGlyphProps = {
  name: IconName;
};

export function IconGlyph(props: IconGlyphProps): ReactElement | null {
  const { name } = props;

  switch (name) {
    case 'chat':
      return <IconGlyphChat />;
    case 'check':
      return <IconGlyphCheck />;
    case 'chevron':
      return <IconGlyphChevron />;
    case 'copy':
      return <IconGlyphCopy />;
    case 'cross':
      return <IconGlyphCross />;
    case 'external-link':
      return <IconGlyphExternalLink />;
    case 'github':
      return <IconGlyphGithub />;
    case 'hash':
      return <IconGlyphHash />;
    case 'markdown':
      return <IconGlyphMarkdown />;
    case 'menu':
      return <IconGlyphMenu />;
    case 'page':
      return <IconGlyphPage />;
    case 'search':
      return <IconGlyphSearch />;
    case 'x':
      return <IconGlyphX />;
    default:
      return null;
  }
}
