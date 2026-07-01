import { useFlashContext } from './flash-context';

export function useFlash() {
  return useFlashContext().trigger;
}
