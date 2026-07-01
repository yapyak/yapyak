import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react';
import type { AttachmentProps } from '#components/attachment';
import type { OverlayProps } from '#components/overlay';
import type { MenuBaseProps } from '#primitives/menu';

import { Attachment } from '#components/attachment';
import { Overlay } from '#components/overlay';
import { SlideBar } from '#components/slide-bar';
import { useRect } from '#hooks/use-rect';
import { useWindowEventListener } from '#hooks/use-window-event-listener';
import {
  MenuBase,
  MenuBaseRadioGroup,
  MenuBaseSeparator,
} from '#primitives/menu';
import { isModifierWithKey } from '#utils/is-modifier-with-key';

import styles from './menu.module.css';
import { MenuItem } from './menu-item';
import { MenuRadioItem } from './menu-radio-item';

export type MenuProps = Omit<AttachmentProps, 'arrow' | 'restrain'> &
  Pick<OverlayProps, 'onClose'> &
  Pick<MenuBaseProps, 'aria-label'> & {
    matchTargetMinWidth?: boolean;
  };

export function Menu(props: MenuProps) {
  const {
    'aria-label': ariaLabel,
    children,
    className,
    matchTargetMinWidth = false,
    onClose,
    targetElement,
    ...restProps
  } = props;

  const targetRect = useRect(targetElement);

  const handleClose = () => {
    onClose?.();
  };

  useWindowEventListener('blur', handleClose);
  useWindowEventListener('resize', handleClose);
  useWindowEventListener('contextmenu', handleClose);

  const handlePointerDown = (event: PointerEvent) => {
    event.stopPropagation();
  };

  const handleAttachmentKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      event.stopPropagation();
      handleClose();
      return;
    }
    if (isModifierWithKey(event.nativeEvent)) {
      handleClose();
    }
  };

  const handleAttachmentContextMenu = (event: MouseEvent) => {
    event.preventDefault();
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
        aria-modal={true}
        arrow={true}
        margin={4}
        minWidth={matchTargetMinWidth ? targetRect.width : 0}
        offset={1}
        onContextMenu={handleAttachmentContextMenu}
        onKeyDown={handleAttachmentKeyDown}
        onPointerDown={handlePointerDown}
        restrain={true}
        targetElement={targetElement}
      >
        <MenuBase
          aria-label={ariaLabel}
          className={[
            styles.Menu,
            className,
          ]}
          onClose={handleClose}
        >
          <SlideBar>{children}</SlideBar>
        </MenuBase>
      </Attachment>
    </Overlay>
  );
}

Menu.Item = MenuItem;
Menu.RadioGroup = MenuBaseRadioGroup;
Menu.RadioItem = MenuRadioItem;
Menu.Separator = MenuBaseSeparator;
