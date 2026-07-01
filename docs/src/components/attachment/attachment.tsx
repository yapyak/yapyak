import type { ReactElement } from 'react';
import type { BoxProps } from '#primitives/box';
import type { UseAnchoredPositionOptions } from '#hooks/use-anchored-position';
import type { RefOrValue } from '#types';

import { useRef } from 'react';

import { Box } from '#primitives/box';
import { useAnchoredPosition } from '#hooks/use-anchored-position';
import { px } from '#utils/px';

import styles from './attachment.module.css';

export type AttachmentProps = BoxProps &
  UseAnchoredPositionOptions & {
    minHeight?: number;
    minWidth?: number;
    targetElement: RefOrValue<HTMLElement | null>;
  };

export function Attachment(props: AttachmentProps): ReactElement {
  const {
    alignment,
    arrow,
    arrowSize = 16,
    children,
    className,
    margin,
    minHeight = 0,
    minWidth = 0,
    offset,
    placement,
    ref,
    restrain,
    style,
    targetElement,
    ...restProps
  } = props;

  const element = useRef<HTMLDivElement>(null);

  const anchoredPosition = useAnchoredPosition(element, targetElement, {
    alignment,
    arrow,
    arrowSafeOffset: 8,
    arrowSize,
    margin,
    offset,
    placement,
    restrain,
  });

  const anchoredPositionStyle = {
    '--arrow-offset': px(anchoredPosition.arrowOffset),
    '--arrow-size': px(arrowSize),
    '--max-height': pxOrNone(anchoredPosition.maxHeight),
    '--max-width': pxOrNone(anchoredPosition.maxWidth),
    '--min-height': px(minHeight),
    '--min-width': px(minWidth),
    '--x': px(anchoredPosition.rect.x),
    '--y': px(anchoredPosition.rect.y),
  };

  return (
    <Box
      {...restProps}
      className={[
        styles.Attachment,
        className,
      ]}
      data-alignment={anchoredPosition.alignment}
      data-arrow-overflow={anchoredPosition.isArrowOverflow}
      data-docked={anchoredPosition.isDocked}
      data-placement={anchoredPosition.placement}
      ref={[
        element,
        ref,
      ]}
      style={[
        anchoredPositionStyle,
        style,
      ]}
    >
      {arrow && <Box className={styles.Arrow} />}
      <Box className={styles.Content}>{children}</Box>
    </Box>
  );
}

function pxOrNone(value: number): string {
  return value === 0 ? 'none' : px(value);
}
