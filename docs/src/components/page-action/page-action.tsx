import type { BoxProps } from '#components/box';

import { useEffect, useId, useRef, useState } from 'react';
import { t } from 'yapyak';

import { Box } from '#components/box';
import { CheckIcon } from '#components/check-icon';
import { CopyIcon } from '#components/copy-icon';
import { DotsIcon } from '#components/dots-icon';
import { ExternalLinkIcon } from '#components/external-link-icon';
import { OptionDot } from '#components/option-dot';
import { Popover } from '#components/popover';

import styles from './page-action.module.css';

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
  const [copied, setCopied] = useState(false);
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
      setCopied(true);
      if (timeoutRef.current !== undefined) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        setCopied(false);
      }, COPIED_RESET_MS);
    } catch {}
  };

  return (
    <Box
      {...restProps}
      className={[
        styles.PageAction,
        className,
      ]}
    >
      <Box
        aria-label={t('Page actions')}
        as="button"
        className={styles.Trigger}
        popoverTarget={popoverId}
        style={{
          '--trigger-anchor': anchorName,
        }}
        type="button"
      >
        <DotsIcon />
      </Box>
      <Popover
        align="end"
        anchorName={anchorName}
        id={popoverId}
      >
        <Popover.Option onClick={handleCopy}>
          {copied ? <CheckIcon /> : <CopyIcon />}
          <Popover.OptionLabel>
            {copied ? t('Copied') : t('Copy page')}
          </Popover.OptionLabel>
        </Popover.Option>
        <Popover.Option
          as="a"
          href={markdownPath}
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLinkIcon />
          <Popover.OptionLabel>{t('Open markdown')}</Popover.OptionLabel>
        </Popover.Option>
        <Popover.Eyebrow>{t('Chat')}</Popover.Eyebrow>
        {CHAT_PROVIDERS.map((provider) => (
          <Popover.Option
            as="a"
            data-option-value={provider.value}
            href={buildChatHref(provider)}
            key={provider.value}
            rel="noreferrer"
            target="_blank"
          >
            <OptionDot />
            <Popover.OptionLabel>{provider.label}</Popover.OptionLabel>
            <Popover.OptionTrailing>
              <ExternalLinkIcon />
            </Popover.OptionTrailing>
          </Popover.Option>
        ))}
      </Popover>
    </Box>
  );
}
