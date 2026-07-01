import type { PointerEvent } from 'react';
import type { AttachmentProps } from '#components/attachment';
import type { OverlayProps } from '#components/overlay';
import type { MenuBaseProps } from '#primitives/menu';

import { Attachment } from '#components/attachment';
import { Overlay } from '#components/overlay';
import { SlideBar } from '#components/slide-bar';
import {
  MenuBase,
  MenuBaseItem,
  MenuBaseRadioGroup,
  MenuBaseSeparator,
} from '#primitives/menu';

import styles from './menu.module.css';
import { MenuRadioItem } from './menu-radio-item';

export type MenuProps = Omit<AttachmentProps, 'arrow'> &
  Pick<OverlayProps, 'onClose'> &
  Pick<MenuBaseProps, 'aria-label'>;

export function Menu(props: MenuProps) {
  const {
    'aria-label': ariaLabel,
    children,
    className,
    onClose,
    ...restProps
  } = props;

  const handlePointerDown = (event: PointerEvent) => {
    event.stopPropagation();
  };

  return (
    <Overlay
      closeOnEscape={true}
      onClose={onClose}
      onPointerDown={onClose}
    >
      <Attachment
        {...restProps}
        arrow={true}
        margin={4}
        onPointerDown={handlePointerDown}
      >
        <MenuBase
          aria-label={ariaLabel}
          className={[
            styles.Menu,
            className,
          ]}
          onClose={onClose ?? (() => {})}
        >
          <SlideBar>{children}</SlideBar>
        </MenuBase>
      </Attachment>
    </Overlay>
  );
}

Menu.Item = MenuBaseItem;
Menu.RadioGroup = MenuBaseRadioGroup;
Menu.RadioItem = MenuRadioItem;
Menu.Separator = MenuBaseSeparator;
