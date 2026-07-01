import type { MenuProps } from '#components/menu';

import { t } from 'yapyak';

import { Menu } from '#components/menu';

import { PageActionChatMenuItem } from './page-action-chat-menu-item';

export type PageActionChatMenuProps = Omit<
  MenuProps,
  'alignment' | 'aria-label' | 'matchTargetMinWidth' | 'placement'
>;

export function PageActionChatMenu(props: PageActionChatMenuProps) {
  return (
    <Menu
      {...props}
      alignment="center"
      aria-label={t('Open in chat')}
      matchTargetMinWidth={true}
      placement="bottom"
    />
  );
}

PageActionChatMenu.Item = PageActionChatMenuItem;
