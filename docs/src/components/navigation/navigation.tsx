import type { BoxProps } from '#components/box';

import { useLocation } from '@tanstack/react-router';
import { useLayoutEffect, useRef, useState } from 'react';

import { Box } from '#components/box';

import styles from './navigation.module.css';
import { NavigationLink } from './navigation-link';

export interface NavigationProps extends BoxProps<'nav'> {}

interface IndicatorState {
  height: number;
  width: number;
  x: number;
  y: number;
}

const SLIDE_DURATION = 320;

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
      void document.fonts.ready.then(measure);
    }

    const frame = window.requestAnimationFrame(() => {
      setIsReady(true);
    });

    let timeoutId: number | undefined;
    if (
      previousPathnameRef.current !== null &&
      previousPathnameRef.current !== location.pathname
    ) {
      setIsAnimating(true);
      timeoutId = window.setTimeout(() => {
        setIsAnimating(false);
      }, SLIDE_DURATION);
    }
    previousPathnameRef.current = location.pathname;

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [location.pathname]);

  return (
    <Box
      {...restProps}
      as="nav"
      className={[styles.Navigation, className]}
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
        />
      )}
      {children}
    </Box>
  );
}

Navigation.Link = NavigationLink;
