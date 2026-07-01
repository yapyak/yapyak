import type { Point } from './point';
import type { RectJSON } from './rect';

import { Rect } from './rect';

export type AnchoredPositionJSON = {
  alignment: Alignment;
  arrowOffset: number;
  isDocked: boolean;
  maxHeight: number;
  maxWidth: number;
  minHeight: number;
  minWidth: number;
  placement: Placement;
  rect: RectJSON;
};

export type AnchoredPositionOptions = {
  alignment?: Alignment;
  arrow?: boolean;
  arrowSafeOffset?: number;
  arrowSize?: number;
  margin?: number;
  offset?: number;
  placement?: Placement;
  restrain?: boolean;
  scrollOffsetPoint?: Point;
};

type Alignment = 'center' | 'end' | 'start';

type Placement = 'bottom' | 'left' | 'right' | 'top';

export class AnchoredPosition {
  #alignment: Alignment = 'center';
  #arrowOffset = 0;
  #isArrowOverflow = false;
  #isDocked = false;
  #maxHeight = 0;
  #maxWidth = 0;
  #minHeight = 0;
  #minWidth = 0;
  #placement: Placement = 'bottom';
  #rect: Rect = Rect.zero();

  constructor(
    rect: Rect,
    targetRect: Rect,
    containerRect: Rect,
    options: AnchoredPositionOptions,
  ) {
    this.update(rect, targetRect, containerRect, options);
  }

  get alignment(): Alignment {
    return this.#alignment;
  }
  get arrowOffset(): number {
    return this.#arrowOffset;
  }
  get isArrowOverflow(): boolean {
    return this.#isArrowOverflow;
  }
  get isDocked(): boolean {
    return this.#isDocked;
  }
  get maxHeight(): number {
    return this.#maxHeight;
  }
  get maxWidth(): number {
    return this.#maxWidth;
  }
  get minHeight(): number {
    return this.#minHeight;
  }
  get minWidth(): number {
    return this.#minWidth;
  }
  get placement(): Placement {
    return this.#placement;
  }
  get rect() {
    return this.#rect;
  }

  isEqual(other: AnchoredPosition): boolean {
    return (
      this.#rect.isEqual(other.rect) &&
      this.#placement === other.placement &&
      this.#alignment === other.alignment &&
      this.#arrowOffset === other.arrowOffset &&
      this.#isDocked === other.isDocked &&
      this.#minWidth === other.minWidth &&
      this.#maxWidth === other.maxWidth &&
      this.#minHeight === other.minHeight &&
      this.#maxHeight === other.maxHeight
    );
  }

  toJSON(): AnchoredPositionJSON {
    return {
      alignment: this.#alignment,
      arrowOffset: this.#arrowOffset,
      isDocked: this.#isDocked,
      maxHeight: this.#maxHeight,
      maxWidth: this.#maxWidth,
      minHeight: this.#minHeight,
      minWidth: this.#minWidth,
      placement: this.#placement,
      rect: this.#rect.toJSON(),
    };
  }

  update(
    rect: Rect,
    targetRect: Rect,
    containerRect: Rect,
    options: AnchoredPositionOptions,
  ): void {
    const {
      alignment = 'center',
      arrow = false,
      arrowSafeOffset = 0,
      arrowSize = 16,
      margin = 0,
      offset = 0,
      placement = 'bottom',
      restrain = false,
      scrollOffsetPoint,
    } = options;

    const isVertical = [
      'bottom',
      'top',
    ].includes(placement);
    const effectiveOffset = offset + (arrow ? arrowSize / 2 : 0);

    let x = 0;
    let y = 0;
    let minWidth = 0;
    let minHeight = 0;
    let maxWidth = 0;
    let maxHeight = 0;
    let arrowOffset = 0;
    let isDocked = false;
    let currentPlacement = placement;

    let rawIdealX = 0;
    let rawIdealY = 0;

    function align(axis: 'x' | 'y') {
      if (axis === 'x') {
        if (alignment === 'start') {
          return targetRect.left;
        }
        if (alignment === 'center') {
          return targetRect.center.x - rect.width / 2;
        }
        return targetRect.right - rect.width;
      }
      if (alignment === 'start') {
        return targetRect.top;
      }
      if (alignment === 'center') {
        return targetRect.center.y - rect.height / 2;
      }
      return targetRect.bottom - rect.height;
    }

    if (restrain) {
      if (isVertical) {
        const topSpace = targetRect.top - effectiveOffset;
        const bottomSpace =
          containerRect.height - targetRect.bottom - effectiveOffset;

        if (
          (placement === 'top' &&
            rect.height > topSpace &&
            bottomSpace > topSpace) ||
          (placement === 'bottom' &&
            rect.height > bottomSpace &&
            topSpace > bottomSpace)
        ) {
          currentPlacement = placement === 'top' ? 'bottom' : 'top';
        }
      } else {
        const leftSpace = targetRect.left - effectiveOffset;
        const rightSpace =
          containerRect.width - targetRect.right - effectiveOffset;

        if (
          (placement === 'left' &&
            rect.width > leftSpace &&
            rightSpace > leftSpace) ||
          (placement === 'right' &&
            rect.width > rightSpace &&
            leftSpace > rightSpace)
        ) {
          currentPlacement = placement === 'left' ? 'right' : 'left';
        }
      }
    }

    if (!restrain) {
      x = isVertical
        ? align('x')
        : currentPlacement === 'left'
          ? targetRect.left - rect.width - effectiveOffset
          : targetRect.right + effectiveOffset;

      y = isVertical
        ? currentPlacement === 'top'
          ? targetRect.top - rect.height - effectiveOffset
          : targetRect.bottom + effectiveOffset
        : align('y');

      if (scrollOffsetPoint) {
        x -= scrollOffsetPoint.x;
        y -= scrollOffsetPoint.y;
      }

      x = Math.max(
        margin,
        Math.min(x, containerRect.width - rect.width - margin),
      );
      y = Math.max(
        margin,
        Math.min(y, containerRect.height - rect.height - margin),
      );

      maxWidth = containerRect.width - margin * 2;
      maxHeight = containerRect.height - margin * 2;

      if (isVertical) {
        const idealY =
          currentPlacement === 'top'
            ? targetRect.top - rect.height - effectiveOffset
            : targetRect.bottom + effectiveOffset;
        isDocked =
          Math.abs(
            y - (scrollOffsetPoint ? idealY - scrollOffsetPoint.y : idealY),
          ) < 1;
      } else {
        const idealX =
          currentPlacement === 'left'
            ? targetRect.left - rect.width - effectiveOffset
            : targetRect.right + effectiveOffset;
        isDocked =
          Math.abs(
            x - (scrollOffsetPoint ? idealX - scrollOffsetPoint.x : idealX),
          ) < 1;
      }
    } else if (isVertical) {
      y =
        currentPlacement === 'top'
          ? targetRect.top - rect.height - effectiveOffset
          : targetRect.bottom + effectiveOffset;

      rawIdealY = y;

      x = align('x');
      const overflowX = Math.max(
        x + rect.width - containerRect.width + margin,
        0,
      );
      x = Math.max(x - overflowX, margin);

      minWidth = targetRect.width;
      maxWidth = containerRect.width - margin * 2;

      y = Math.max(y, margin);
      maxHeight =
        currentPlacement === 'top'
          ? targetRect.top - effectiveOffset - margin
          : containerRect.height - targetRect.bottom - effectiveOffset - margin;

      if (maxHeight >= containerRect.height - margin * 2) {
        const overflowY = Math.max(
          y + rect.height - containerRect.height + margin,
          0,
        );
        y -= overflowY;
        maxHeight = containerRect.height - margin * 2;
      }

      maxHeight = Math.min(maxHeight, containerRect.height - y - margin);

      if (scrollOffsetPoint) {
        x -= scrollOffsetPoint.x;
        y -= scrollOffsetPoint.y;
      }

      const adjustedRawY = scrollOffsetPoint
        ? rawIdealY - scrollOffsetPoint.y
        : rawIdealY;
      isDocked = Math.abs(y - adjustedRawY) < 1;
    } else {
      x =
        currentPlacement === 'left'
          ? targetRect.left - rect.width - effectiveOffset
          : targetRect.right + effectiveOffset;

      rawIdealX = x;

      y = align('y');
      const overflowY = Math.max(
        y + rect.height - containerRect.height + margin,
        0,
      );
      y = Math.max(y - overflowY, margin);

      minHeight = targetRect.height;
      maxHeight = containerRect.height - margin * 2;

      x = Math.max(x, margin);
      maxWidth =
        currentPlacement === 'left'
          ? targetRect.left - effectiveOffset - margin
          : containerRect.width - targetRect.right - effectiveOffset - margin;

      if (maxWidth >= containerRect.width - margin * 2) {
        const overflowX = Math.max(
          x + rect.width - containerRect.width + margin + offset,
          0,
        );
        x -= overflowX;
        maxWidth = containerRect.width - margin * 2;
      }

      if (scrollOffsetPoint) {
        x -= scrollOffsetPoint.x;
        y -= scrollOffsetPoint.y;
      }

      const adjustedRawX = scrollOffsetPoint
        ? rawIdealX - scrollOffsetPoint.x
        : rawIdealX;
      isDocked = Math.abs(x - adjustedRawX) < 1;
    }

    if (arrow) {
      if (
        [
          'bottom',
          'top',
        ].includes(currentPlacement)
      ) {
        arrowOffset = targetRect.center.x - x - arrowSize / 2;

        const leftEdge = arrowOffset;
        const rightEdge = arrowOffset + arrowSize;

        const overflowLeft = leftEdge < arrowSafeOffset;
        const overflowRight = rightEdge > rect.width - arrowSafeOffset;

        this.#isArrowOverflow = overflowLeft || overflowRight;
      } else {
        arrowOffset = targetRect.center.y - y - arrowSize / 2;

        const topEdge = arrowOffset;
        const bottomEdge = arrowOffset + arrowSize;

        const overflowTop = topEdge < arrowSafeOffset;
        const overflowBottom = bottomEdge > rect.height - arrowSafeOffset;

        this.#isArrowOverflow = overflowTop || overflowBottom;
      }

      arrowOffset = Math.round(arrowOffset);
    }

    this.#rect = new Rect(
      Math.round(x),
      Math.round(y),
      rect.width,
      rect.height,
    );

    this.#placement = currentPlacement;
    this.#alignment = alignment;
    this.#arrowOffset = Math.round(arrowOffset);
    this.#isDocked = restrain || isDocked;
    this.#minWidth = minWidth;
    this.#maxWidth = Math.round(maxWidth);
    this.#minHeight = minHeight;
    this.#maxHeight = Math.round(maxHeight);
  }
}
