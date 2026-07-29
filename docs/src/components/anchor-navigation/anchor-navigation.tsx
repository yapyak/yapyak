import type { Anchor } from '@yapyak/docs-compiler';
import type { BoxProps } from '#primitives/box';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { t } from 'yapyak';

import { useWindowEventListener } from '#hooks/use-window-event-listener';
import { Box } from '#primitives/box';

import styles from './anchor-navigation.module.css';
import { AnchorNavigationLink } from './anchor-navigation-link';

const ACTIVATION_LINE_PERCENT = 35;
const BOTTOM_THRESHOLD_PX = 4;

export type AnchorNavigationProps = BoxProps<'nav'> & {
  anchors: Anchor[];
  indicator?: boolean;
};

export function AnchorNavigation(props: AnchorNavigationProps) {
  const { anchors, className, indicator = false, ...restProps } = props;

  const element = useRef<HTMLElement | null>(null);
  const itemElementsRef = useRef(new Map<string, HTMLAnchorElement>());
  const lockedIdRef = useRef<string | undefined>(undefined);
  const wasVisibleRef = useRef(false);
  const headingId = useId();
  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const [isAnimationEnabled, setIsAnimationEnabled] = useState(false);

  const handleUserInteraction = () => {
    setIsAnimationEnabled(true);
  };

  const handleUserScroll = () => {
    setIsAnimationEnabled(true);
    lockedIdRef.current = undefined;
  };

  useWindowEventListener('pointerdown', handleUserInteraction, {
    once: true,
  });
  useWindowEventListener('wheel', handleUserScroll, {
    passive: true,
  });
  useWindowEventListener('touchmove', handleUserScroll, {
    passive: true,
  });
  useWindowEventListener('keydown', handleUserScroll);

  useEffect(() => {
    const lastAnchor = anchors[anchors.length - 1];
    if (lastAnchor === undefined) {
      return;
    }
    const lastId = lastAnchor.id;

    const tryEdges = () => {
      if (lockedIdRef.current !== undefined) {
        return true;
      }
      const atBottom =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - BOTTOM_THRESHOLD_PX;
      if (atBottom) {
        setActiveId(lastId);
        return true;
      }
      return false;
    };

    const observer = new IntersectionObserver(
      () => {
        if (tryEdges()) {
          return;
        }

        const line = (window.innerHeight * ACTIVATION_LINE_PERCENT) / 100;
        let activeAnchorId: string | undefined;
        for (const anchor of anchors) {
          const headingElement = document.getElementById(anchor.id);
          if (!headingElement) {
            continue;
          }
          if (headingElement.getBoundingClientRect().top <= line) {
            activeAnchorId = anchor.id;
          } else {
            break;
          }
        }
        setActiveId(activeAnchorId);
      },
      {
        rootMargin: `-${ACTIVATION_LINE_PERCENT}% 0px -${
          100 - ACTIVATION_LINE_PERCENT
        }% 0px`,
      },
    );

    for (const anchor of anchors) {
      const headingElement = document.getElementById(anchor.id);
      if (headingElement) {
        observer.observe(headingElement);
      }
    }

    const handleScroll = () => {
      tryEdges();
    };
    window.addEventListener('scroll', handleScroll, {
      passive: true,
    });
    tryEdges();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [
    anchors,
  ]);

  useLayoutEffect(() => {
    if (activeId === undefined) {
      wasVisibleRef.current = false;
      return;
    }
    const $element = element.current;
    const itemElement = itemElementsRef.current.get(activeId);
    if (!$element || !itemElement) {
      return;
    }
    const isAppearing = !wasVisibleRef.current;
    wasVisibleRef.current = true;
    if (isAppearing) {
      $element.style.setProperty('--indicator-duration', '0ms');
    }
    $element.style.setProperty('--indicator-top', `${itemElement.offsetTop}px`);
    $element.style.setProperty(
      '--indicator-height',
      `${itemElement.offsetHeight}px`,
    );
    if (isAppearing) {
      void $element.offsetHeight;
      $element.style.removeProperty('--indicator-duration');
    }
  }, [
    activeId,
  ]);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) {
      return;
    }
    if (anchors.some((anchor) => anchor.id === hash)) {
      setActiveId(hash);
    }
  }, [
    anchors,
  ]);

  const handleActivate = (id: string) => {
    lockedIdRef.current = id;
    setActiveId(id);
  };

  return (
    <Box
      {...restProps}
      aria-labelledby={headingId}
      as="nav"
      className={[
        styles.AnchorNavigation,
        className,
      ]}
      data-active={activeId !== undefined}
      data-animation-enabled={isAnimationEnabled}
      data-indicator={indicator}
      ref={element}
    >
      <Box className={styles.Rail}>
        <Box
          as="h3"
          className={styles.Heading}
          id={headingId}
        >
          {t('On this page')}
        </Box>
        <Box
          as="ul"
          className={styles.List}
        >
          {anchors.map((anchor) => (
            <Box
              as="li"
              key={anchor.id}
            >
              <AnchorNavigationLink
                active={activeId === anchor.id}
                anchor={anchor}
                onActivate={handleActivate}
                ref={(itemElement) => {
                  if (itemElement) {
                    itemElementsRef.current.set(anchor.id, itemElement);
                  } else {
                    itemElementsRef.current.delete(anchor.id);
                  }
                }}
              />
            </Box>
          ))}
        </Box>
        <Box
          aria-hidden="true"
          className={styles.Indicator}
        />
      </Box>
    </Box>
  );
}
