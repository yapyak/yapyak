import type { HeadingEntry } from '@yapyak/doc-extractor';
import type { MouseEvent } from 'react';
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

const HEADER_OFFSET = 88;
const SCROLL_GAP = 24;
const ACTIVE_LINE_PX = HEADER_OFFSET + SCROLL_GAP;

export interface ContentAnchorNavigationProps extends BoxProps<'nav'> {
  headings: HeadingEntry[];
}

export function ContentAnchorNavigation(props: ContentAnchorNavigationProps) {
  const { className, headings, ...restProps } = props;

  const containerRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef(new Map<string, HTMLAnchorElement>());
  const [activeId, setActiveId] = useState<string | null>(
    headings[0]?.id ?? null,
  );

  // Scrollspy via IntersectionObserver.
  // rootMargin pushes top of viewport down by header height and bottom up by 70%,
  // creating a narrow active band just below the header.
  useEffect(() => {
    if (headings.length === 0) return;

    const intersecting = new Map<string, boolean>();

    const recompute = () => {
      // Prefer the topmost intersecting heading.
      for (const heading of headings) {
        if (intersecting.get(heading.id)) {
          setActiveId(heading.id);
          return;
        }
      }
      // None intersecting: pick the last heading whose top is above the active line.
      let lastAbove: string | null = null;
      for (const heading of headings) {
        const element = document.getElementById(heading.id);
        if (!element) continue;
        if (element.getBoundingClientRect().top < ACTIVE_LINE_PX) {
          lastAbove = heading.id;
        }
      }
      if (lastAbove) {
        setActiveId(lastAbove);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).id;
          intersecting.set(id, entry.isIntersecting);
        }
        recompute();
      },
      {
        rootMargin: `-${HEADER_OFFSET}px 0px -70% 0px`,
        threshold: 0,
      },
    );

    for (const heading of headings) {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    }

    // Initial pass so we have a sensible active state before the first scroll.
    recompute();

    return () => observer.disconnect();
  }, [headings]);

  // Slide indicator: write CSS vars on the container based on active item's box.
  useLayoutEffect(() => {
    if (!activeId) return;
    const container = containerRef.current;
    const item = itemRefs.current.get(activeId);
    if (!container || !item) return;

    container.style.setProperty('--indicator-top', `${item.offsetTop}px`);
    container.style.setProperty('--indicator-height', `${item.offsetHeight}px`);
  }, [activeId, headings]);

  // Deep-link on mount: if URL has a matching hash, scroll into view with our offset.
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const element = document.getElementById(hash);
    if (!element) return;

    requestAnimationFrame(() => {
      const top =
        element.getBoundingClientRect().top +
        window.scrollY -
        HEADER_OFFSET -
        SCROLL_GAP;
      window.scrollTo({ behavior: 'auto', top });
      setActiveId(hash);
    });
  }, []);

  const handleActivate = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, id: string) => {
      event.preventDefault();
      const element = document.getElementById(id);
      if (!element) return;

      const top =
        element.getBoundingClientRect().top +
        window.scrollY -
        HEADER_OFFSET -
        SCROLL_GAP;
      window.scrollTo({ behavior: 'smooth', top });
      setActiveId(id);
      window.history.pushState(null, '', `#${id}`);
    },
    [],
  );

  if (headings.length === 0) return null;

  return (
    <Box
      {...restProps}
      aria-label={t('On this page')}
      as="nav"
      className={[styles.ContentAnchorNavigation, className]}
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
