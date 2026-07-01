import { getWindow } from './dom/get-window';
import { isTextBox } from './is-text-box';

export function isCaretAtStart(element: HTMLElement) {
  if (!isTextBox(element)) {
    return false;
  }

  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    return isCaretAtStartInInput(element);
  }

  return isCaretAtStartInContentEditable(element);
}

function isCaretAtStartInContentEditable(element: HTMLElement) {
  if (!element.isContentEditable) {
    return false;
  }

  const selection = getWindow(element).getSelection();

  if (!selection || selection.rangeCount === 0) {
    return false;
  }

  const range = selection.getRangeAt(0);

  if (!element.contains(range.startContainer)) {
    return false;
  }

  return range.startOffset === 0 && range.endOffset === 0;
}

function isCaretAtStartInInput(
  element: HTMLInputElement | HTMLTextAreaElement,
) {
  return element.selectionStart === 0 && element.selectionEnd === 0;
}
