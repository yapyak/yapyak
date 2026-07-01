export type IsFocusableOptions = {
  tabbableOnly?: boolean;
};

export function isFocusable(
  element: HTMLElement,
  options: IsFocusableOptions = {},
) {
  const { tabbableOnly = true } = options;

  if (element.hidden || !isRendered(element)) {
    return false;
  }

  const tabIndex = readTabIndex(element);
  if (tabIndex !== null) {
    if (tabbableOnly && tabIndex < 0) {
      return false;
    }
    return !isDisabled(element);
  }

  return isNativelyFocusable(element);
}

function isRendered(element: HTMLElement) {
  return (
    element.offsetWidth > 0 ||
    element.offsetHeight > 0 ||
    element.getClientRects().length > 0
  );
}

function isDisabled(element: HTMLElement) {
  return 'disabled' in element && (element as HTMLInputElement).disabled;
}

function readTabIndex(element: HTMLElement) {
  const attribute = element.getAttribute('tabindex');
  return attribute === null ? null : Number.parseInt(attribute, 10);
}

function isNativelyFocusable(element: HTMLElement) {
  const tag = element.tagName;
  if (tag === 'A' || tag === 'AREA') {
    return element.hasAttribute('href');
  }
  if (
    tag === 'BUTTON' ||
    tag === 'INPUT' ||
    tag === 'SELECT' ||
    tag === 'TEXTAREA'
  ) {
    if (isDisabled(element)) {
      return false;
    }
    return tag !== 'INPUT' || (element as HTMLInputElement).type !== 'hidden';
  }
  if (tag === 'AUDIO' || tag === 'VIDEO') {
    return element.hasAttribute('controls');
  }
  if (element.isContentEditable) {
    return true;
  }
  return (
    tag === 'IFRAME' ||
    tag === 'OBJECT' ||
    tag === 'EMBED' ||
    tag === 'DETAILS' ||
    tag === 'SUMMARY'
  );
}
