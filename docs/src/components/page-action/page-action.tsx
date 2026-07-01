import type { BoxProps } from '#primitives/box';

import { useEffect, useRef, useState } from 'react';
import { t } from 'yapyak';

import { ChatIcon } from '#components/chat-icon';
import { CheckIcon } from '#components/check-icon';
import { CopyIcon } from '#components/copy-icon';
import { MarkdownIcon } from '#components/markdown-icon';
import { Popover, PopoverTrigger } from '#components/popover';
import { Box } from '#primitives/box';

import styles from './page-action.module.css';
import { PageActionChatItem } from './page-action-chat-item';
import { PageActionLinkTile } from './page-action-link-tile';
import { PageActionTile } from './page-action-tile';

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

export type PageActionProps = BoxProps & {
  href: string;
};

export function PageAction(props: PageActionProps) {
  const { className, href, ...restProps } = props;
  const [isCopied, setIsCopied] = useState(false);
  const [origin, setOrigin] = useState<string>();
  const timeoutRef = useRef<number>(undefined);

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
      className={[
        styles.PageAction,
        className,
      ]}
      role="group"
    >
      <PageActionTile
        icon={isCopied ? <CheckIcon /> : <CopyIcon />}
        label={isCopied ? t('Copied') : t('Copy')}
        onClick={handleCopy}
      />
      <PageActionLinkTile
        href={markdownPath}
        icon={<MarkdownIcon />}
        label={t('Markdown')}
      />
      <PopoverTrigger
        popover={(popoverProps) => (
          <Popover
            {...popoverProps}
            alignment="end"
            placement="bottom"
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
        )}
      >
        {(triggerProps) => (
          <PageActionTile
            {...triggerProps}
            className={styles.ChatTile}
            icon={<ChatIcon />}
            label={t('Chat')}
          />
        )}
      </PopoverTrigger>
    </Box>
  );
}
