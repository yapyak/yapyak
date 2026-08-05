import { Viewport } from '../geometry';
import { getWindow } from './get-window';

export function getViewport(element?: Element) {
  const win = getWindow(element);
  const viewport = win.visualViewport;

  if (!viewport) {
    return Viewport.zero();
  }

  return new Viewport(
    viewport.width,
    viewport.height,
    viewport.offsetLeft,
    viewport.offsetTop,
    win.innerWidth,
    win.innerHeight,
  );
}
