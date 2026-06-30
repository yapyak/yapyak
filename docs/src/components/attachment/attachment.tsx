import type { ReactElement } from 'react';
import type { BoxProps } from '#components/box';
import type { UseAnchoredPositionOptions } from '#hooks/use-anchored-position';
import type { RefOrValue } from '#types';

import { useRef } from 'react';

import { Box } from '#components/box';
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
      {arrow && (
        <Box className={styles.Arrow}>
          <svg
            aria-hidden={true}
            role="presentation"
            viewBox={getArrowViewBox(anchoredPosition.placement, arrowSize)}
          >
            <path
              className={styles.ArrowOuter}
              d={getArrowOuterPath(anchoredPosition.placement, arrowSize)}
            />
            <path
              className={styles.ArrowInner}
              d={getArrowInnerPath(anchoredPosition.placement, arrowSize)}
            />
          </svg>
        </Box>
      )}
      <Box className={styles.Content}>{children}</Box>
    </Box>
  );
}

type Placement = 'bottom' | 'left' | 'right' | 'top';

function getArrowDimensions(
  placement: Placement,
  arrowSize: number,
): {
  height: number;
  width: number;
} {
  if (placement === 'top' || placement === 'bottom') {
    return {
      height: arrowSize / 2,
      width: arrowSize,
    };
  }
  return {
    height: arrowSize,
    width: arrowSize / 2,
  };
}

function getArrowViewBox(placement: Placement, arrowSize: number): string {
  const { width, height } = getArrowDimensions(placement, arrowSize);
  return `-1 -1 ${width + 2} ${height + 2}`;
}

function getArrowOuterPath(placement: Placement, arrowSize: number): string {
  const { width: w, height: h } = getArrowDimensions(placement, arrowSize);
  const r = Math.SQRT1_2;
  const d = Math.SQRT2;
  switch (placement) {
    case 'bottom':
      return `M ${w / 2} 0 L 0 ${h} L ${-r} ${h - r} L ${w / 2} ${-d} L ${w + r} ${h - r} L ${w} ${h} Z`;
    case 'top':
      return `M ${w / 2} ${h} L 0 0 L ${-r} ${r} L ${w / 2} ${h + d} L ${w + r} ${r} L ${w} 0 Z`;
    case 'right':
      return `M 0 ${h / 2} L ${w} 0 L ${w - r} ${-r} L ${-d} ${h / 2} L ${w - r} ${h + r} L ${w} ${h} Z`;
    case 'left':
      return `M ${w} ${h / 2} L 0 0 L ${r} ${-r} L ${w + d} ${h / 2} L ${r} ${h + r} L 0 ${h} Z`;
    default:
      return '';
  }
}

function getArrowInnerPath(placement: Placement, arrowSize: number): string {
  const { width: w, height: h } = getArrowDimensions(placement, arrowSize);
  switch (placement) {
    case 'bottom':
      return `M ${w / 2} 0 L ${w} ${h + 1} L 0 ${h + 1} Z`;
    case 'top':
      return `M ${w / 2} ${h} L ${w} -1 L 0 -1 Z`;
    case 'right':
      return `M 0 ${h / 2} L ${w + 1} 0 L ${w + 1} ${h} Z`;
    case 'left':
      return `M ${w} ${h / 2} L -1 ${h} L -1 0 Z`;
    default:
      return '';
  }
}

function pxOrNone(value: number): string {
  return value === 0 ? 'none' : px(value);
}
