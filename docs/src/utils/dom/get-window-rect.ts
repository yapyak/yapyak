import { Rect } from '../geometry';
import { getWindow } from './get-window';

export function getWindowRect(element?: Element) {
  const win = getWindow(element);
  return new Rect(0, 0, win.innerWidth, win.innerHeight);
}
