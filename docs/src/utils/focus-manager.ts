import { getDocument } from './dom/get-document';
import { isFocusable } from './is-focusable';

export type FocusManagerGetNodesOptions = {
  tabbableOnly?: boolean;
};

export type FocusManagerStepOptions = {
  loop?: boolean;
  tabbableOnly?: boolean;
};

export class FocusManager {
  element: HTMLElement;

  constructor(element: HTMLElement) {
    this.element = element;
  }

  getNodes(options: FocusManagerGetNodesOptions = {}) {
    const { tabbableOnly = false } = options;

    return getFocusableDescendants(this.element, {
      tabbableOnly,
    });
  }

  first(options: FocusManagerGetNodesOptions = {}) {
    this.getNodes(options)[0]?.focus();
  }

  last(options: FocusManagerGetNodesOptions = {}) {
    const items = this.getNodes(options);
    items[items.length - 1]?.focus();
  }

  next(options: FocusManagerStepOptions = {}) {
    const { loop = false, tabbableOnly = false } = options;
    const items = this.getNodes({
      tabbableOnly,
    });
    const index = this.activeIndex(items);
    const target = items[index + 1] ?? (loop ? items[0] : undefined);
    target?.focus();
  }

  previous(options: FocusManagerStepOptions = {}) {
    const { loop = false, tabbableOnly = false } = options;
    const items = this.getNodes({
      tabbableOnly,
    });
    const index = this.activeIndex(items);
    let target: HTMLElement | undefined;
    if (index === -1) {
      target = items[items.length - 1];
    } else if (index > 0) {
      target = items[index - 1];
    } else if (loop) {
      target = items[items.length - 1];
    }
    target?.focus();
  }

  find(
    predicate: (node: HTMLElement) => boolean,
    options: FocusManagerGetNodesOptions = {},
  ) {
    this.getNodes(options).find(predicate)?.focus();
  }

  activeIndex(items: HTMLElement[]) {
    const active = getDocument(this.element)
      .activeElement as HTMLElement | null;
    return active ? items.indexOf(active) : -1;
  }
}

type FocusTreeWalkerOptions = {
  tabbableOnly?: boolean;
};

function getFocusableDescendants(
  root: HTMLElement,
  options: FocusTreeWalkerOptions = {},
) {
  const walker = createFocusTreeWalker(root, options);
  const descendants: HTMLElement[] = [];
  let next = walker.nextNode();
  while (next) {
    descendants.push(next as HTMLElement);
    next = walker.nextNode();
  }
  return descendants;
}

function createFocusTreeWalker(root: Node, options: FocusTreeWalkerOptions) {
  const { tabbableOnly = true } = options;
  return getDocument(root).createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      if (
        isFocusable(node as HTMLElement, {
          tabbableOnly,
        })
      ) {
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_SKIP;
    },
  });
}
