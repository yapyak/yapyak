import { Rect } from '../geometry';

export function getRect(element: Element) {
  const { height, width, x, y } = element.getBoundingClientRect();

  return new Rect(x, y, width, height);
}
