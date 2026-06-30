import { Rect } from '#utils/geometry';

export function getRect(element: Element): Rect {
  const { height, width, x, y } = element.getBoundingClientRect();

  return new Rect(x, y, width, height);
}
