import type { BoxProps } from '#components/box';

import { useEffect, useId, useRef, useState } from 'react';
import { t } from 'yapyak';

import { Box } from '#components/box';
import { ChevronIcon } from '#components/chevron-icon';
import { Popover } from '#components/popover';

import styles from './page-action.module.css';
import { PageActionChatItem } from './page-action-chat-item';

const COPIED_RESET_MS = 1500;

type ChatProvider = {
  buildUrl: (encodedPrompt: string) => string;
  label: string;
  value: string;
};

const CHAT_PROVIDERS: ChatProvider[] = [
  {
    buildUrl: (encoded) => `https://chatgpt.com/?hints=search&q=${encoded}`,
    label: 'ChatGPT',
    value: 'chatgpt',
  },
  {
    buildUrl: (encoded) => `https://claude.ai/new?q=${encoded}`,
    label: 'Claude',
    value: 'claude',
  },
  {
    buildUrl: (encoded) =>
      `cursor://anysphere.cursor-deeplink/prompt?text=${encoded}`,
    label: 'Cursor',
    value: 'cursor',
  },
  {
    buildUrl: (encoded) => `https://t3.chat/new?q=${encoded}`,
    label: 'T3 Chat',
    value: 't3-chat',
  },
];

export type PageActionProps = BoxProps<'nav'> & {
  href: string;
};

export function PageAction(props: PageActionProps) {
  const { className, href, ...restProps } = props;
  const [isCopied, setIsCopied] = useState(false);
  const [origin, setOrigin] = useState<string | undefined>(undefined);
  const timeoutRef = useRef<number | undefined>(undefined);
  const popoverId = useId();
  const anchorName = `--anchor${popoverId.replace(/[^a-z0-9-]/gi, '-')}`;

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(
    () => () => {
      if (timeoutRef.current !== undefined) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  const markdownPath = `${href}.md`;

  const buildChatHref = (provider: ChatProvider): string | undefined => {
    if (origin === undefined) {
      return undefined;
    }
    const absoluteUrl = `${origin}${markdownPath}`;
    const prompt = `I want you to yap about this page: ${absoluteUrl}`;
    return provider.buildUrl(encodeURIComponent(prompt));
  };

  const handleCopy = async () => {
    try {
      const response = await fetch(markdownPath);
      const text = await response.text();
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      if (timeoutRef.current !== undefined) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        setIsCopied(false);
      }, COPIED_RESET_MS);
    } catch {}
  };

  return (
    <Box
      {...restProps}
      aria-label={t('Page actions')}
      as="nav"
      className={[
        styles.PageAction,
        className,
      ]}
    >
      <Box className={styles.Eyebrow}>{t('Actions')}</Box>
      <Box className={styles.List}>
        <Box
          as="button"
          className={styles.Item}
          onClick={handleCopy}
          type="button"
        >
          <Box
            as="span"
            className={styles.Text}
          >
            {isCopied ? t('Copied') : t('Copy page')}
          </Box>
        </Box>
        <Box
          as="a"
          className={styles.Item}
          href={markdownPath}
          rel="noreferrer"
          target="_blank"
        >
          <Box
            as="span"
            className={styles.Text}
          >
            {t('Open markdown')}
          </Box>
        </Box>
        <Box
          as="button"
          className={[
            styles.Item,
            styles.ChatItem,
          ]}
          popoverTarget={popoverId}
          style={{
            '--trigger-anchor': anchorName,
          }}
          type="button"
        >
          <Box
            as="span"
            className={styles.Text}
          >
            {t('Chat')}
          </Box>
          <ChevronIcon
            className={styles.TrailingIcon}
            direction="right"
          />
        </Box>
      </Box>
      <Popover
        align="end"
        anchorName={anchorName}
        id={popoverId}
      >
        {CHAT_PROVIDERS.map((provider) => (
          <PageActionChatItem
            href={buildChatHref(provider)}
            key={provider.value}
            label={provider.label}
            value={provider.value}
          />
        ))}
      </Popover>
    </Box>
  );
}
