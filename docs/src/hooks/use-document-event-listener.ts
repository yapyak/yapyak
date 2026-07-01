import type { UseEventListenerOptions } from './use-event-listener';

import { getDocument } from '#utils/dom';

import { useEventListener } from './use-event-listener';

export type DocumentListenerEvent = keyof DocumentEventMap;

export type DocumentListener<K extends keyof DocumentEventMap> = (
  event: DocumentEventMap[K],
) => void;

export function useDocumentEventListener<T extends DocumentListenerEvent>(
  type: T,
  listener: DocumentListener<T>,
  options?: UseEventListenerOptions,
): void {
  useEventListener(getDocumentIfAvailable(), type, listener, options);
}

function getDocumentIfAvailable() {
  return typeof document === 'undefined' ? null : getDocument();
}
