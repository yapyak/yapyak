import { Rect } from '#utils/geometry';

import { getWindow } from './get-window';

export function getWindowRect(element?: Element): Rect {
  const win = getWindow(element);
  return new Rect(0, 0, win.innerWidth, win.innerHeight);
}
