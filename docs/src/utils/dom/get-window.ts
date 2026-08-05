import { getDocument } from './get-document';

export function getWindow(element?: Element) {
  return getDocument(element).defaultView ?? window;
}
