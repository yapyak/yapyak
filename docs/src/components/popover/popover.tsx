import type { PointerEvent } from 'react';
import type { AttachmentProps } from '#components/attachment';
import type { OverlayProps } from '#components/overlay';

import { useLocation } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';

import { Attachment } from '#components/attachment';
import { Overlay } from '#components/overlay';

import { PopoverEyebrow } from './popover-eyebrow';
import { PopoverOption } from './popover-option';
import { PopoverOptionLabel } from './popover-option-label';
import { PopoverOptionTrailing } from './popover-option-trailing';

export type PopoverProps = AttachmentProps &
  Pick<OverlayProps, 'onClose'> & {
    closeOnRouteChange?: boolean;
    dismissable?: boolean;
  };

export function Popover(props: PopoverProps) {
  const {
    closeOnRouteChange = false,
    dismissable = false,
    onClose,
    ...restProps
  } = props;

  const location = useLocation();
  const initialHrefRef = useRef(location.href);

  useEffect(() => {
    if (closeOnRouteChange && location.href !== initialHrefRef.current) {
      onClose?.();
    }
  }, [
    closeOnRouteChange,
    location.href,
    onClose,
  ]);

  const handlePointerDown = (event: PointerEvent) => {
    event.stopPropagation();
  };

  return (
    <Overlay
      closeOnEscape={dismissable}
      onClose={onClose}
      onPointerDown={onClose}
    >
      <Attachment
        {...restProps}
        arrow={true}
        margin={4}
        onPointerDown={handlePointerDown}
        role="dialog"
        tabIndex={-1}
      />
    </Overlay>
  );
}

Popover.Eyebrow = PopoverEyebrow;
Popover.Option = PopoverOption;
Popover.OptionLabel = PopoverOptionLabel;
Popover.OptionTrailing = PopoverOptionTrailing;
