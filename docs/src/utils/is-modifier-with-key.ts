import { hasModifierKey } from './has-modifier-key';
import { isModifierKey } from './is-modifier-key';

export function isModifierWithKey(event: KeyboardEvent) {
  return hasModifierKey(event) && !isModifierKey(event);
}
