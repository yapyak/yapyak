import type { TransitionEvent } from 'react';
import type { BoxProps } from '#primitives/box';

import { useLocation } from '@tanstack/react-router';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

import { Box } from '#primitives/box';

import styles from './navigation.module.css';
import { NavigationLink } from './navigation-link';

export type NavigationProps = BoxProps<'nav'>;

type IndicatorState = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export function Navigation(props: NavigationProps) {
  const { children, className, ...restProps } = props;
  const element = useRef<HTMLElement>(null);
  const previousPathnameRef = useRef<string | null>(null);
  const [indicator, setIndicator] = useState<IndicatorState | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const location = useLocation();

  useLayoutEffect(() => {
    const $element = element.current;
    if ($element === null) {
      return;
    }

    const measure = () => {
      const activeElement = $element.querySelector('[data-status="active"]');
      if (!(activeElement instanceof HTMLElement)) {
        return;
      }
      setIndicator({
        height: activeElement.offsetHeight,
        width: activeElement.offsetWidth,
        x: activeElement.offsetLeft,
        y: activeElement.offsetTop,
      });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe($element);

    if (typeof document !== 'undefined' && document.fonts) {
      void (async () => {
        await document.fonts.ready;
        measure();
      })();
    }

    const frame = window.requestAnimationFrame(() => {
      setIsReady(true);
    });

    if (
      previousPathnameRef.current !== null &&
      previousPathnameRef.current !== location.pathname
    ) {
      setIsAnimating(true);
    }
    previousPathnameRef.current = location.pathname;

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [
    location.pathname,
  ]);

  const handleIndicatorTransitionEnd = useCallback(
    (event: TransitionEvent<HTMLSpanElement>) => {
      if (event.propertyName !== 'transform') {
        return;
      }
      setIsAnimating(false);
    },
    [],
  );

  return (
    <Box
      {...restProps}
      as="nav"
      className={[
        styles.Navigation,
        className,
      ]}
      data-animating={isAnimating}
      ref={element}
      style={
        indicator
          ? {
              '--navigation-indicator-height': `${indicator.height}px`,
              '--navigation-indicator-width': `${indicator.width}px`,
              '--navigation-indicator-x': `${indicator.x}px`,
              '--navigation-indicator-y': `${indicator.y}px`,
            }
          : undefined
      }
    >
      {indicator && (
        <Box
          aria-hidden="true"
          as="span"
          className={styles.IndicatorBar}
          data-ready={isReady}
          onTransitionEnd={handleIndicatorTransitionEnd}
        />
      )}
      {children}
    </Box>
  );
}

Navigation.Link = NavigationLink;
