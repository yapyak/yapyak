import type { SwatchAccent } from '#components/swatch';

import { ExternalLinkIcon } from '#components/external-link-icon';
import { Menu } from '#components/menu';
import { Swatch } from '#components/swatch';

export type PageActionChatProvider = {
  buildUrl: (encodedPrompt: string) => string;
  label: string;
  value: string;
};

export type PageActionChatMenuItemProps = {
  onSelect: (provider: PageActionChatProvider) => void;
  provider: PageActionChatProvider;
};

export function PageActionChatMenuItem(props: PageActionChatMenuItemProps) {
  const { onSelect, provider } = props;

  const handleSelect = () => {
    onSelect(provider);
  };

  return (
    <Menu.Item
      leadingIcon={<Swatch accent={provider.value as SwatchAccent} />}
      onSelect={handleSelect}
      trailingIcon={<ExternalLinkIcon />}
    >
      {provider.label}
    </Menu.Item>
  );
}
