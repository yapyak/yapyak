export function hasModifierKey(event: KeyboardEvent) {
  return event.metaKey || event.ctrlKey || event.altKey;
}
