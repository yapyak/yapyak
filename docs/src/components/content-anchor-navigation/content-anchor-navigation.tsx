import type { HeadingEntry } from '@yapyak/doc-compiler';
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
const BOTTOM_THRESHOLD_PX = 24;

export type ContentAnchorNavigationProps = BoxProps<'nav'> & {
  headings: HeadingEntry[];
};

export function ContentAnchorNavigation(props: ContentAnchorNavigationProps) {
  const { className, headings, ...restProps } = props;

  const containerRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef(new Map<string, HTMLAnchorElement>());
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) {
      return;
    }

    let frame = 0;

    const recompute = () => {
      const viewportBottom = window.scrollY + window.innerHeight;
      const documentBottom = document.documentElement.scrollHeight;
      if (viewportBottom >= documentBottom - BOTTOM_THRESHOLD_PX) {
        setActiveId(null);
        return;
      }

      let lastAbove: string | null = null;
      for (const heading of headings) {
        const element = document.getElementById(heading.id);
        if (!element) {
          continue;
        }
        const paddingTop = Number.parseFloat(
          window.getComputedStyle(element).paddingTop || '0',
        );
        const textTop = element.getBoundingClientRect().top + paddingTop;
        if (textTop < ACTIVE_LINE_PX) {
          lastAbove = heading.id;
        } else {
          break;
        }
      }
      setActiveId(lastAbove);
    };

    const onScroll = () => {
      if (frame !== 0) {
        return;
      }
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        recompute();
      });
    };

    recompute();
    window.addEventListener('scroll', onScroll, {
      passive: true,
    });
    window.addEventListener('resize', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
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
    window.requestAnimationFrame(() => {
      element.scrollIntoView({
        behavior: 'auto',
        block: 'start',
      });
    });
  }, []);

  const handleActivate = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, id: string) => {
      event.preventDefault();
      const element = document.getElementById(id);
      if (!element) {
        return;
      }
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      window.history.pushState(null, '', `#${id}`);
    },
    [],
  );

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
        {activeId !== null && (
          <Box
            aria-hidden="true"
            className={styles.Indicator}
          />
        )}
      </Box>
    </Box>
  );
}
