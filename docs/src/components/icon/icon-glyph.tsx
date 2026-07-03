import type { ReactElement } from 'react';

import { IconGlyphChat } from './icon-glyph-chat';
import { IconGlyphCheck } from './icon-glyph-check';
import { IconGlyphChevron } from './icon-glyph-chevron';
import { IconGlyphCopy } from './icon-glyph-copy';
import { IconGlyphExternalLink } from './icon-glyph-external-link';
import { IconGlyphGithub } from './icon-glyph-github';
import { IconGlyphHash } from './icon-glyph-hash';
import { IconGlyphMarkdown } from './icon-glyph-markdown';
import { IconGlyphOutline } from './icon-glyph-outline';
import { IconGlyphSidebar } from './icon-glyph-sidebar';
import { IconGlyphX } from './icon-glyph-x';

export type IconName =
  | 'chat'
  | 'check'
  | 'chevron'
  | 'copy'
  | 'external-link'
  | 'github'
  | 'hash'
  | 'markdown'
  | 'outline'
  | 'sidebar'
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
    case 'external-link':
      return <IconGlyphExternalLink />;
    case 'github':
      return <IconGlyphGithub />;
    case 'hash':
      return <IconGlyphHash />;
    case 'markdown':
      return <IconGlyphMarkdown />;
    case 'outline':
      return <IconGlyphOutline />;
    case 'sidebar':
      return <IconGlyphSidebar />;
    case 'x':
      return <IconGlyphX />;
    default:
      return null;
  }
}
