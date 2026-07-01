import type { SwatchAccent } from '#components/swatch';
import type { BoxProps } from '#primitives/box';

import { ExternalLinkIcon } from '#components/external-link-icon';
import { Popover } from '#components/popover';
import { Swatch } from '#components/swatch';

export type PageActionChatItemProps = BoxProps<'a'> & {
  href: string | undefined;
  label: string;
  value: string;
};

export function PageActionChatItem(props: PageActionChatItemProps) {
  const { href, label, value, ...restProps } = props;

  return (
    <Popover.Option
      {...restProps}
      as="a"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      <Swatch accent={value as SwatchAccent} />
      <Popover.OptionLabel>{label}</Popover.OptionLabel>
      <Popover.OptionTrailing>
        <ExternalLinkIcon />
      </Popover.OptionTrailing>
    </Popover.Option>
  );
}
