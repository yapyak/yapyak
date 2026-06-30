import { getDocument } from './get-document';

export function getWindow(element?: Element): Window {
  return getDocument(element).defaultView ?? window;
}
