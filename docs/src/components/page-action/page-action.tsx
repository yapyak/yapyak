import { useEffect, useId, useRef, useState } from 'react';
import { t } from 'yapyak';

import { Box } from '#components/box';
import { ChatIcon } from '#components/chat-icon';
import { CheckIcon } from '#components/check-icon';
import { ChevronIcon } from '#components/chevron-icon';
import { CopyIcon } from '#components/copy-icon';
import { ExternalLinkIcon } from '#components/external-link-icon';
import { OptionDot } from '#components/option-dot';
import { Popover } from '#components/popover';
import popoverStyles from '#components/popover/popover.module.css';

import styles from './page-action.module.css';

const COPIED_RESET_MS = 1500;

type Provider = {
  buildUrl: (encodedPrompt: string) => string;
  label: string;
  value: string;
};

const PROVIDERS: Provider[] = [
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

export type PageActionProps = {
  href: string;
};

export function PageAction(props: PageActionProps) {
  const { href } = props;
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);
  const popoverId = useId();
  const anchorName = `--anchor${popoverId.replace(/[^a-z0-9-]/gi, '-')}`;

  useEffect(
    () => () => {
      if (timeoutRef.current !== undefined) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  const markdownPath = `${href}.md`;

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

  const handleProviderClick = (provider: Provider) => {
    const absoluteUrl = `${window.location.origin}${markdownPath}`;
    const prompt = `I want you to yap about this page: ${absoluteUrl}`;
    const encoded = encodeURIComponent(prompt);
    window.open(provider.buildUrl(encoded), '_blank', 'noopener,noreferrer');
  };

  return (
    <Box
      aria-label={t('Page actions')}
      as="nav"
      className={styles.PageAction}
    >
      <Box
        aria-live="polite"
        as="button"
        className={styles.Button}
        data-copied={copied}
        onClick={handleCopy}
        type="button"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
        <Box
          as="span"
          className={styles.ButtonLabel}
        >
          {copied ? t('Copied') : t('Copy')}
        </Box>
      </Box>
      <Box
        as="button"
        className={styles.OpenInButton}
        popoverTarget={popoverId}
        style={{
          '--trigger-anchor': anchorName,
        }}
        type="button"
      >
        <ChatIcon />
        <Box
          as="span"
          className={styles.ButtonLabel}
        >
          {t('Chat')}
        </Box>
        <ChevronIcon direction="down" />
      </Box>
      <Box
        as="a"
        className={styles.Button}
        href={markdownPath}
        rel="noreferrer"
        target="_blank"
      >
        <ExternalLinkIcon />
        <Box
          as="span"
          className={styles.ButtonLabel}
        >
          {t('Open')}
        </Box>
      </Box>
      <Popover
        align="start"
        anchorName={anchorName}
        id={popoverId}
      >
        <Box className={styles.ProviderList}>
          {PROVIDERS.map((provider) => (
            <Box
              as="button"
              className={popoverStyles.Option}
              data-option-value={provider.value}
              key={provider.value}
              onClick={() => handleProviderClick(provider)}
              type="button"
            >
              <OptionDot />
              <Box
                as="span"
                className={popoverStyles.OptionLabel}
              >
                {provider.label}
              </Box>
              <Box
                as="span"
                className={popoverStyles.OptionTrailing}
              >
                <ExternalLinkIcon />
              </Box>
            </Box>
          ))}
        </Box>
      </Popover>
    </Box>
  );
}
