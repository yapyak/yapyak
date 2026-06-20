import type { HeadingEntry } from '@yapyak/doc-compiler';
import type { BoxProps } from '#components/box';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { t } from 'yapyak';

import { Box } from '#components/box';

import styles from './content-anchor-navigation.module.css';
import { ContentAnchorNavigationItem } from './content-anchor-navigation-item';

const HEADER_OFFSET_PX = 88;
const BOTTOM_THRESHOLD_PX = 4;
const SCROLL_LOCK_FALLBACK_MS = 1200;

export type ContentAnchorNavigationProps = BoxProps<'nav'> & {
  headings: HeadingEntry[];
};

export function ContentAnchorNavigation(props: ContentAnchorNavigationProps) {
  const { className, headings, ...restProps } = props;

  const containerRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef(new Map<string, HTMLAnchorElement>());
  const lockedIdRef = useRef<string | null>(null);
  const lockTimeoutRef = useRef<number | undefined>(undefined);
  const lockReleaseRef = useRef<(() => void) | undefined>(undefined);
  const [activeId, setActiveId] = useState<string | null>(
    headings[0]?.id ?? null,
  );

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

        let lastAbove: string | null = null;
        for (const heading of headings) {
          const element = document.getElementById(heading.id);
          if (!element) {
            continue;
          }
          if (element.getBoundingClientRect().top < HEADER_OFFSET_PX) {
            lastAbove = heading.id;
          } else {
            break;
          }
        }
        if (lastAbove !== null) {
          setActiveId(lastAbove);
        }
      },
      {
        rootMargin: `-${HEADER_OFFSET_PX}px 0px -50% 0px`,
      },
    );

    for (const heading of headings) {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    }

    const onScroll = () => {
      tryEdges();
    };
    window.addEventListener('scroll', onScroll, {
      passive: true,
    });
    tryEdges();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [
    headings,
  ]);

  useLayoutEffect(() => {
    if (activeId === null) {
      return;
    }
    const container = containerRef.current;
    const item = itemRefs.current.get(activeId);
    if (!container || !item) {
      return;
    }
    container.style.setProperty('--indicator-top', `${item.offsetTop}px`);
    container.style.setProperty('--indicator-height', `${item.offsetHeight}px`);
  }, [
    activeId,
  ]);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) {
      return;
    }
    const element = document.getElementById(hash);
    if (!element) {
      return;
    }
    if (headings.some((heading) => heading.id === hash)) {
      setActiveId(hash);
    }
    window.requestAnimationFrame(() => {
      element.scrollIntoView({
        behavior: 'auto',
        block: 'start',
      });
    });
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

  const handleActivate = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (!element) {
      return;
    }

    lockedIdRef.current = id;
    setActiveId(id);

    element.scrollIntoView({
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
  }, []);

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
      ref={containerRef}
    >
      <Box className={styles.Rail}>
        <Box className={styles.Eyebrow}>{t('On this page')}</Box>
        <Box className={styles.List}>
          {headings.map((heading) => (
            <ContentAnchorNavigationItem
              heading={heading}
              isActive={activeId === heading.id}
              key={heading.id}
              onActivate={handleActivate}
              ref={(element) => {
                if (element) {
                  itemRefs.current.set(heading.id, element);
                } else {
                  itemRefs.current.delete(heading.id);
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
