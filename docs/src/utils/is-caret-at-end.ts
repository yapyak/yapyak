import { isTextBox } from './is-text-box';

export function isCaretAtEnd(element: HTMLElement) {
  if (!isTextBox(element)) {
    return false;
  }
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    return (
      element.selectionStart === element.value.length &&
      element.selectionEnd === element.value.length
    );
  }
  if (element.isContentEditable) {
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    const selection = window.getSelection();
    const compRange = selection?.getRangeAt(0);
    const length = element.textContent?.length;

    return compRange?.startOffset === length && compRange?.endOffset === length;
  }
  return false;
}
