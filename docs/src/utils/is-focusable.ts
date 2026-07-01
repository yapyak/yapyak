const SELECTORS = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'details',
  'summary',
  'iframe',
  'object',
  'embed',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]',
];

const FOCUSABLE_SELECTOR = `${SELECTORS.join(':not([hidden]),')},[tabindex]:not([disabled]):not([hidden])`;

SELECTORS.push('[tabindex]:not([tabindex="-1"]):not([disabled])');

const TABBABLE_SELECTOR = SELECTORS.join(
  ':not([hidden]):not([tabindex="-1"]), ',
);

export type IsFocusableOptions = {
  tabbableOnly?: boolean;
};

export function isFocusable(
  element: HTMLElement,
  options: IsFocusableOptions = {},
) {
  const { tabbableOnly = true } = options;

  if (tabbableOnly) {
    return element.matches(TABBABLE_SELECTOR) && isVisible(element);
  }

  return element.matches(FOCUSABLE_SELECTOR) && isVisible(element);
}

function isVisible(element: HTMLElement) {
  return (
    element.offsetWidth > 0 ||
    element.offsetHeight > 0 ||
    element.getClientRects().length > 0
  );
}
