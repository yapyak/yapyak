import type { Block } from '@yapyak/doc-compiler';
import type { BoxProps } from '#primitives/box';

import { getHeadings } from '@yapyak/doc-compiler';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { t } from 'yapyak';

import { useWindowEventListener } from '#hooks/use-window-event-listener';
import { Box } from '#primitives/box';

import styles from './page-anchor-navigation.module.css';
import { PageAnchorNavigationItem } from './page-anchor-navigation-item';

const ACTIVATION_LINE_PERCENT = 35;
const BOTTOM_THRESHOLD_PX = 4;
const HEADING_LEVELS = {
  maxLevel: 3,
  minLevel: 2,
};

export type PageAnchorNavigationProps = BoxProps<'nav'> & {
  blocks: Block[];
  indicator?: boolean;
};

export function PageAnchorNavigation(props: PageAnchorNavigationProps) {
  const { blocks, className, indicator = false, ...restProps } = props;

  const headings = useMemo(
    () => getHeadings(blocks, HEADING_LEVELS),
    [
      blocks,
    ],
  );

  const element = useRef<HTMLElement | null>(null);
  const itemElementsRef = useRef(new Map<string, HTMLAnchorElement>());
  const lockedIdRef = useRef<string | null>(null);
  const wasVisibleRef = useRef(false);
  const headingId = useId();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isAnimationEnabled, setIsAnimationEnabled] = useState(false);

  const handleUserInteraction = () => {
    setIsAnimationEnabled(true);
  };

  const handleUserScroll = () => {
    setIsAnimationEnabled(true);
    lockedIdRef.current = null;
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
    const lastHeading = headings[headings.length - 1];
    if (lastHeading === undefined) {
      return;
    }
    const lastId = lastHeading.id;

    const tryEdges = () => {
      if (lockedIdRef.current !== null) {
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
        let activeHeadingId: string | null = null;
        for (const heading of headings) {
          const headingElement = document.getElementById(heading.id);
          if (!headingElement) {
            continue;
          }
          if (headingElement.getBoundingClientRect().top <= line) {
            activeHeadingId = heading.id;
          } else {
            break;
          }
        }
        setActiveId(activeHeadingId);
      },
      {
        rootMargin: `-${ACTIVATION_LINE_PERCENT}% 0px -${
          100 - ACTIVATION_LINE_PERCENT
        }% 0px`,
      },
    );

    for (const heading of headings) {
      const headingElement = document.getElementById(heading.id);
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
    headings,
  ]);

  useLayoutEffect(() => {
    if (activeId === null) {
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
    if (headings.some((heading) => heading.id === hash)) {
      setActiveId(hash);
    }
  }, [
    headings,
  ]);

  const handleActivate = (id: string) => {
    lockedIdRef.current = id;
    setActiveId(id);
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <Box
      {...restProps}
      aria-labelledby={headingId}
      as="nav"
      className={[
        styles.PageAnchorNavigation,
        className,
      ]}
      data-active={activeId !== null}
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
        <Box className={styles.List}>
          {headings.map((heading) => (
            <PageAnchorNavigationItem
              active={activeId === heading.id}
              heading={heading}
              key={heading.id}
              onActivate={handleActivate}
              ref={(itemElement) => {
                if (itemElement) {
                  itemElementsRef.current.set(heading.id, itemElement);
                } else {
                  itemElementsRef.current.delete(heading.id);
                }
              }}
            />
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
