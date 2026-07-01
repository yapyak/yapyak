import type { HeadingEntry } from '@yapyak/doc-compiler';
import type { BoxProps } from '#primitives/box';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { t } from 'yapyak';

import { Box } from '#primitives/box';

import styles from './content-anchor-navigation.module.css';
import { ContentAnchorNavigationItem } from './content-anchor-navigation-item';

const HEADER_OFFSET_PX = 88;
const BOTTOM_THRESHOLD_PX = 4;
const SCROLL_LOCK_FALLBACK_MS = 1200;

export type ContentAnchorNavigationProps = BoxProps<'nav'> & {
  headings: HeadingEntry[];
  rail?: boolean;
};

export function ContentAnchorNavigation(props: ContentAnchorNavigationProps) {
  const { className, headings, rail = false, ...restProps } = props;

  const element = useRef<HTMLElement | null>(null);
  const itemElementsRef = useRef(new Map<string, HTMLAnchorElement>());
  const lockedIdRef = useRef<string | null>(null);
  const lockTimeoutRef = useRef<number>(undefined);
  const lockReleaseRef = useRef<(() => void) | undefined>(undefined);
  const [activeId, setActiveId] = useState(headings[0]?.id ?? null);
  const [isAnimationEnabled, setIsAnimationEnabled] = useState(false);

  useEffect(() => {
    const frameHandle = window.requestAnimationFrame(() => {
      setIsAnimationEnabled(true);
    });
    return () => {
      window.cancelAnimationFrame(frameHandle);
    };
  }, []);

  useEffect(() => {
    if (headings.length === 0) {
      return;
    }

    const firstHeading = headings[0];
    const lastHeading = headings[headings.length - 1];
    if (firstHeading === undefined || lastHeading === undefined) {
      return;
    }
    const firstId = firstHeading.id;
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
      if (window.scrollY <= 0) {
        setActiveId(firstId);
        return true;
      }
      return false;
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (tryEdges()) {
          return;
        }

        const intersecting = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const topmost = intersecting[0];
        if (topmost !== undefined) {
          setActiveId(topmost.target.id);
          return;
        }

        let lastAbove: string | undefined;
        for (const heading of headings) {
          const headingElement = document.getElementById(heading.id);
          if (!headingElement) {
            continue;
          }
          if (headingElement.getBoundingClientRect().top < HEADER_OFFSET_PX) {
            lastAbove = heading.id;
          } else {
            break;
          }
        }
        if (lastAbove !== undefined) {
          setActiveId(lastAbove);
        }
      },
      {
        rootMargin: `-${HEADER_OFFSET_PX}px 0px -50% 0px`,
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
      return;
    }
    const $element = element.current;
    const itemElement = itemElementsRef.current.get(activeId);
    if (!$element || !itemElement) {
      return;
    }
    $element.style.setProperty('--indicator-top', `${itemElement.offsetTop}px`);
    $element.style.setProperty(
      '--indicator-height',
      `${itemElement.offsetHeight}px`,
    );
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

  useEffect(
    () => () => {
      if (lockTimeoutRef.current !== undefined) {
        window.clearTimeout(lockTimeoutRef.current);
      }
      if (lockReleaseRef.current !== undefined) {
        window.removeEventListener('scrollend', lockReleaseRef.current);
      }
    },
    [],
  );

  const handleActivate = (id: string) => {
    const targetElement = document.getElementById(id);
    if (!targetElement) {
      return;
    }

    lockedIdRef.current = id;
    setActiveId(id);

    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });

    if (lockReleaseRef.current !== undefined) {
      window.removeEventListener('scrollend', lockReleaseRef.current);
    }
    if (lockTimeoutRef.current !== undefined) {
      window.clearTimeout(lockTimeoutRef.current);
    }

    const release = () => {
      lockedIdRef.current = null;
      if (lockReleaseRef.current !== undefined) {
        window.removeEventListener('scrollend', lockReleaseRef.current);
        lockReleaseRef.current = undefined;
      }
      if (lockTimeoutRef.current !== undefined) {
        window.clearTimeout(lockTimeoutRef.current);
        lockTimeoutRef.current = undefined;
      }
    };

    lockReleaseRef.current = release;
    window.addEventListener('scrollend', release, {
      once: true,
    });
    lockTimeoutRef.current = window.setTimeout(
      release,
      SCROLL_LOCK_FALLBACK_MS,
    );
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <Box
      {...restProps}
      aria-label={t('On this page')}
      as="nav"
      className={[
        styles.ContentAnchorNavigation,
        className,
      ]}
      data-animation-enabled={isAnimationEnabled}
      data-rail={rail}
      ref={element}
    >
      <Box className={styles.Rail}>
        <Box className={styles.Eyebrow}>{t('On this page')}</Box>
        <Box className={styles.List}>
          {headings.map((heading) => (
            <ContentAnchorNavigationItem
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
