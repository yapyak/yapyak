import { Offset } from '../geometry/offset';

export function getScrollOffset(element: Element) {
  return new Offset(
    Math.floor(element.scrollLeft),
    Math.floor(element.scrollTop),
    Math.floor(
      element.scrollWidth - (element.scrollLeft + element.clientWidth),
    ),
    Math.floor(
      element.scrollHeight - (element.scrollTop + element.clientHeight),
    ),
  );
}
