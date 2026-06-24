import type { BoxProps } from '#components/box';

import { ExternalLinkIcon } from '#components/external-link-icon';
import { OptionDot } from '#components/option-dot';
import { Popover } from '#components/popover';

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
      data-option-value={value}
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      <OptionDot />
      <Popover.OptionLabel>{label}</Popover.OptionLabel>
      <Popover.OptionTrailing>
        <ExternalLinkIcon />
      </Popover.OptionTrailing>
    </Popover.Option>
  );
}
