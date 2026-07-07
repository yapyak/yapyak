import type { ReactNode } from 'react';
import type { ComposableRef } from '#types';
import type { AnimateState } from './animate-context';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { AnimateContext } from './animate-context';
import { useAnimateContext } from './use-animate-context';

const EXIT_FALLBACK_BUFFER_MS = 50;

export type AnimateChildProps = {
  'data-animate'?: 'enter' | 'exit';
  inert?: true;
  ref: ComposableRef<HTMLDivElement>;
};

export type AnimateProps = {
  children: (props: AnimateChildProps) => ReactNode;
  in: boolean;
};

export function Animate(props: AnimateProps) {
  const { children, in: inProp } = props;

  const parentState = useAnimateContext();
  const isOpen = inProp && parentState !== 'exit';

  const element = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<AnimateState | 'unmounted'>(
    isOpen ? 'enter' : 'unmounted',
  );

  useLayoutEffect(() => {
    setState((prev) => {
      if (isOpen) {
        if (prev === 'unmounted') {
          return 'enter';
        }
        if (prev === 'exit') {
          return 'idle';
        }
        return prev;
      }
      if (prev === 'enter' || prev === 'idle') {
        return 'exit';
      }
      return prev;
    });
  }, [
    isOpen,
  ]);

  useLayoutEffect(() => {
    if (state !== 'enter') {
      return;
    }
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        setState('idle');
      });
    });
    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [
    state,
  ]);

  useEffect(() => {
    if (state !== 'exit') {
      return;
    }
    const $element = element.current;
    if (!$element) {
      setState('unmounted');
      return;
    }
    const duration = getTransitionDuration($element);
    if (duration === 0) {
      setState('unmounted');
      return;
    }
    const handleTransitionEnd = (event: TransitionEvent) => {
      if (event.target === $element && event.propertyName === 'transform') {
        setState('unmounted');
      }
    };
    $element.addEventListener('transitionend', handleTransitionEnd);
    const timer = window.setTimeout(() => {
      setState('unmounted');
    }, duration + EXIT_FALLBACK_BUFFER_MS);
    return () => {
      $element.removeEventListener('transitionend', handleTransitionEnd);
      window.clearTimeout(timer);
    };
  }, [
    state,
  ]);

  if (state === 'unmounted') {
    return null;
  }
  const childProps: AnimateChildProps = {
    ref: element,
  };
  if (state === 'enter') {
    childProps['data-animate'] = 'enter';
  } else if (state === 'exit') {
    childProps['data-animate'] = 'exit';
    childProps.inert = true;
  }
  return <AnimateContext value={state}>{children(childProps)}</AnimateContext>;
}

function getTransitionDuration($element: HTMLElement): number {
  const style = window.getComputedStyle($element);
  const durations = style.transitionDuration.split(',');
  const delays = style.transitionDelay.split(',');
  const totals = durations.map(
    (duration, index) => parseTime(duration) + parseTime(delays[index] ?? '0s'),
  );
  return Math.max(0, ...totals);
}

function parseTime(value: string): number {
  const trimmed = value.trim();
  if (trimmed.endsWith('ms')) {
    return Number.parseFloat(trimmed);
  }
  if (trimmed.endsWith('s')) {
    return Number.parseFloat(trimmed) * 1000;
  }
  return 0;
}
