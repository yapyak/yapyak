import { useLocation } from '@tanstack/react-router';
import {
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { cn } from '#lib/cn';
import { NavigationLink } from './navigation-link';
import styles from './navigation.module.css';

export interface NavigationProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

export declare namespace Navigation {
  let Link: typeof NavigationLink;
}

interface IndicatorState {
  x: number;
  y: number;
  width: number;
  height: number;
}

const SLIDE_DURATION = 320;

export function Navigation(props: NavigationProps): ReactElement {
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
    const activeElement = $element.querySelector('[data-status="active"]');
    if (!(activeElement instanceof HTMLElement)) {
      return;
    }
    setIndicator({
      x: activeElement.offsetLeft,
      y: activeElement.offsetTop,
      width: activeElement.offsetWidth,
      height: activeElement.offsetHeight,
    });

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
      window.cancelAnimationFrame(frame);
      if (timeout !== undefined) {
        window.clearTimeout(timeout);
      }
    };
  }, [location.pathname]);

  const indicatorStyle: CSSProperties | undefined = indicator
    ? {
        transform: `translate(${indicator.x}px, ${indicator.y}px)`,
        width: `${indicator.width}px`,
        height: `${indicator.height}px`,
      }
    : undefined;

  return (
    <nav
      {...restProps}
      ref={element}
      className={cn(styles.Navigation, className)}
      data-animating={isAnimating ? '' : undefined}
    >
      {indicator && (
        <span
          aria-hidden="true"
          className={styles.Indicator}
          data-ready={isReady ? '' : undefined}
          style={indicatorStyle}
        />
      )}
      {children}
    </nav>
  );
}

Navigation.Link = NavigationLink;
