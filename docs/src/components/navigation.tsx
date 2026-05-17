import type { BoxProps } from '#components/box';

import { useLocation } from '@tanstack/react-router';
import { useLayoutEffect, useRef, useState } from 'react';

import { Box } from '#components/box';

import { NavigationLink } from './navigation/link';
import styles from './navigation.module.css';

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
    if (!$element) {
      return;
    }

    const measure = () => {
      const $activeElement = $element.querySelector('[data-status="active"]');
      if (!($activeElement instanceof HTMLElement)) {
        return;
      }
      setIndicator({
        height: $activeElement.offsetHeight,
        width: $activeElement.offsetWidth,
        x: $activeElement.offsetLeft,
        y: $activeElement.offsetTop,
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

    let timeout: number | undefined;
    if (
      previousPathnameRef.current !== null &&
      previousPathnameRef.current !== location.pathname
    ) {
      setIsAnimating(true);
      timeout = window.setTimeout(() => {
        setIsAnimating(false);
      }, SLIDE_DURATION);
    }
    previousPathnameRef.current = location.pathname;

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      if (timeout !== undefined) {
        window.clearTimeout(timeout);
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
    >
      {indicator && (
        <Box
          aria-hidden="true"
          as="span"
          className={styles.Indicator}
          data-ready={isReady}
          style={{
            height: `${indicator.height}px`,
            transform: `translate(${indicator.x}px, ${indicator.y}px)`,
            width: `${indicator.width}px`,
          }}
        />
      )}
      {children}
    </Box>
  );
}

Navigation.Link = NavigationLink;
