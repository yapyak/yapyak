const MODIFIER_KEYS = new Set([
  'Alt',
  'Control',
  'Meta',
]);

export function isModifierKey(event: KeyboardEvent) {
  return MODIFIER_KEYS.has(event.key);
}
