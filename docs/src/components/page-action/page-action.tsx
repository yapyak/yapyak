import type { Page } from '@yapyak/docs-compiler';
import type { BoxProps } from '#primitives/box';
import type { SwatchAccent } from '../swatch';

import { useEffect, useRef, useState } from 'react';
import { t } from 'yapyak';

import { Box } from '#primitives/box';

import { Icon } from '../icon';
import { Menu, MenuTrigger } from '../menu';
import { Swatch } from '../swatch';
import styles from './page-action.module.css';
import { PageActionButton } from './page-action-button';
import { PageActionLink } from './page-action-link';

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
  page: Page;
};

export function PageAction(props: PageActionProps) {
  const { className, page, ...restProps } = props;
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

  const markdownPath = `${page.href}.md`;

  const handleChatSelect = (provider: ChatProvider) => {
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
        data-copied={isCopied}
        icon={
          isCopied ? (
            <Icon
              name="check"
              size="14"
            />
          ) : (
            <Icon
              name="copy"
              size="14"
            />
          )
        }
        label={isCopied ? t('Copied') : t('Copy')}
        onClick={handleCopy}
      />
      <PageActionLink
        href={markdownPath}
        icon={
          <Icon
            name="markdown"
            size="16"
          />
        }
        label={t('Markdown')}
      />
      <MenuTrigger
        menu={(menuProps) => (
          <Menu
            {...menuProps}
            alignment="center"
            aria-label={t('Open in chat')}
            matchTargetMinWidth={true}
            placement="bottom"
          >
            {CHAT_PROVIDERS.map((provider) => (
              <Menu.Item
                key={provider.value}
                leadingIcon={<Swatch accent={provider.value as SwatchAccent} />}
                onSelect={() => handleChatSelect(provider)}
                trailingIcon={
                  <Icon
                    name="external-link"
                    size="14"
                  />
                }
              >
                {provider.label}
              </Menu.Item>
            ))}
          </Menu>
        )}
      >
        {(triggerProps) => (
          <PageActionButton
            {...triggerProps}
            className={styles.ChatButton}
            icon={
              <Icon
                name="chat"
                size="14"
              />
            }
            label={t('Chat')}
            trailingIcon={<Icon name="chevron" />}
          />
        )}
      </MenuTrigger>
    </Box>
  );
}
