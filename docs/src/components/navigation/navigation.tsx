import type { TransitionEvent } from 'react';
import type { BoxProps } from '#primitives/box';

import { useLocation } from '@tanstack/react-router';
import { useLayoutEffect, useRef, useState } from 'react';

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
  const [isAnimating, setIsAnimating] = useState(false);
  const location = useLocation();

  useLayoutEffect(() => {
    const $element = element.current;
    if ($element === null) {
      return;
    }

    const measure = () => {
      if ($element.offsetWidth === 0) {
        return;
      }
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

    if (
      previousPathnameRef.current !== null &&
      previousPathnameRef.current !== location.pathname &&
      $element.offsetWidth !== 0
    ) {
      setIsAnimating(true);
    }
    previousPathnameRef.current = location.pathname;

    return () => {
      observer.disconnect();
    };
  }, [
    location.pathname,
  ]);

  const handleIndicatorTransitionEnd = (
    event: TransitionEvent<HTMLSpanElement>,
  ) => {
    if (event.propertyName === 'left') {
      setIsAnimating(false);
    }
  };

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
      {children}
      {indicator && (
        <Box
          aria-hidden="true"
          as="span"
          className={styles.IndicatorBar}
          inert={true}
          onTransitionEnd={handleIndicatorTransitionEnd}
        >
          <Box className={styles.IndicatorLabels}>{children}</Box>
        </Box>
      )}
    </Box>
  );
}

Navigation.Link = NavigationLink;
