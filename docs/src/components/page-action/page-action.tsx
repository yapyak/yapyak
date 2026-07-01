import type { BoxProps } from '#primitives/box';
import type { PageActionChatProvider } from './page-action-chat-menu-item';

import { useEffect, useRef, useState } from 'react';
import { t } from 'yapyak';

import { ChatIcon } from '#components/chat-icon';
import { CheckIcon } from '#components/check-icon';
import { ChevronIcon } from '#components/chevron-icon';
import { CopyIcon } from '#components/copy-icon';
import { MarkdownIcon } from '#components/markdown-icon';
import { MenuTrigger } from '#components/menu';
import { Box } from '#primitives/box';

import styles from './page-action.module.css';
import { PageActionButton } from './page-action-button';
import { PageActionChatMenu } from './page-action-chat-menu';
import { PageActionLink } from './page-action-link';

const COPIED_RESET_MS = 1500;

const CHAT_PROVIDERS: PageActionChatProvider[] = [
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

  const handleChatSelect = (provider: PageActionChatProvider) => {
    if (origin === undefined) {
      return;
    }
    const absoluteUrl = `${origin}${markdownPath}`;
    const prompt = `I want you to yap about this page: ${absoluteUrl}`;
    const chatUrl = provider.buildUrl(encodeURIComponent(prompt));
    window.open(chatUrl, '_blank', 'noreferrer');
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
      <PageActionButton
        icon={isCopied ? <CheckIcon /> : <CopyIcon />}
        label={isCopied ? t('Copied') : t('Copy')}
        onClick={handleCopy}
      />
      <PageActionLink
        href={markdownPath}
        icon={<MarkdownIcon />}
        label={t('Markdown')}
      />
      <MenuTrigger
        menu={(menuProps) => (
          <PageActionChatMenu {...menuProps}>
            {CHAT_PROVIDERS.map((provider) => (
              <PageActionChatMenu.Item
                key={provider.value}
                onSelect={handleChatSelect}
                provider={provider}
              />
            ))}
          </PageActionChatMenu>
        )}
      >
        {(triggerProps) => (
          <PageActionButton
            {...triggerProps}
            className={styles.ChatButton}
            icon={<ChatIcon />}
            label={t('Chat')}
            trailingIcon={<ChevronIcon direction="down" />}
          />
        )}
      </MenuTrigger>
    </Box>
  );
}
