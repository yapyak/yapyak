import type { RefObject } from 'react';
import type { BoxProps } from '#primitives/box';

import { useEffect, useRef, useState } from 'react';

import { useScrollOffset } from '#hooks/use-scroll-offset';
import { Box } from '#primitives/box';

import { ScrollHandle } from './scroll-handle';
import styles from './slide-bar.module.css';

export type SlideBarProps = BoxProps & {
  innerRef?: RefObject<HTMLDivElement | null>;
};

const SCROLL_STEP = 4;
const WHEEL_IDLE_DELAY = 100;

export function SlideBar(props: SlideBarProps) {
  const { children, className, innerRef, ...restProps } = props;

  const innerElement = useRef<HTMLDivElement>(null);

  const scrollOffset = useScrollOffset(innerElement);

  const hasStartScrollOffset = scrollOffset.top > 0;
  const hasEndScrollOffset = scrollOffset.bottom > 0;

  const isWheelScrolling = useIsWheelScrolling(innerElement);

  const handleStartScrollHandlePerform = () => {
    innerElement.current?.scrollBy({
      top: -SCROLL_STEP,
    });
  };

  const handleEndScrollHandlePerform = () => {
    innerElement.current?.scrollBy({
      top: SCROLL_STEP,
    });
  };

  return (
    <Box
      {...restProps}
      className={[
        styles.SlideBar,
        className,
      ]}
      data-with-end-scroll-offset={hasEndScrollOffset}
      data-with-start-scroll-offset={hasStartScrollOffset}
    >
      <Box
        className={styles.Inner}
        ref={
          innerRef
            ? [
                innerElement,
                innerRef,
              ]
            : innerElement
        }
      >
        {children}
      </Box>
      {hasStartScrollOffset && (
        <ScrollHandle
          disabled={isWheelScrolling}
          onPerform={handleStartScrollHandlePerform}
          placement="start"
        />
      )}
      {hasEndScrollOffset && (
        <ScrollHandle
          disabled={isWheelScrolling}
          onPerform={handleEndScrollHandlePerform}
          placement="end"
        />
      )}
    </Box>
  );
}

function useIsWheelScrolling(ref: RefObject<HTMLDivElement | null>) {
  const [isScrolling, setIsScrolling] = useState(false);
  const timeoutRef = useRef<number>(undefined);

  useEffect(() => {
    const $element = ref.current;
    if ($element === null) {
      return;
    }

    const handleWheel = () => {
      setIsScrolling(true);
      if (timeoutRef.current !== undefined) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        setIsScrolling(false);
      }, WHEEL_IDLE_DELAY);
    };

    $element.addEventListener('wheel', handleWheel, {
      passive: true,
    });

    return () => {
      $element.removeEventListener('wheel', handleWheel);
      if (timeoutRef.current !== undefined) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [
    ref,
  ]);

  return isScrolling;
}
