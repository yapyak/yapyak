const TYPES = new Set([
  'date',
  'datetime-local',
  'datetime',
  'email',
  'month',
  'number',
  'password',
  'search',
  'tel',
  'text',
  'time',
  'url',
  'week',
]);

export function isTextBox(element: HTMLElement) {
  if (element instanceof HTMLInputElement) {
    return TYPES.has(element.type.toLowerCase());
  }

  if (element instanceof HTMLTextAreaElement) {
    return true;
  }

  return element.isContentEditable;
}
