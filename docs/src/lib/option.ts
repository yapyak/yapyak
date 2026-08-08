import type { OptionsRegistry } from '@yapyak/docs-compiler';

export const OPTION_STORAGE_PREFIX = 'yapyak.option.';
export const OPTION_PREPAINT_STYLE_ID = 'yapyak-options-prepaint';

export function readStoredOptions(
  registry: OptionsRegistry,
): Record<string, string> {
  const stored: Record<string, string> = {};
  for (const groupId of Object.keys(registry)) {
    try {
      const value = window.localStorage.getItem(
        `${OPTION_STORAGE_PREFIX}${groupId}`,
      );
      if (value !== null && value !== '') {
        stored[groupId] = value;
      }
    } catch {}
  }
  return stored;
}

export function toSearchKey(groupId: string): string {
  return groupId.replace(
    /[A-Z]/g,
    (character) => `-${character.toLowerCase()}`,
  );
}

export function buildPrepaintScript(registry: OptionsRegistry): string {
  const values: Record<string, string[]> = {};
  const searchKeys: Record<string, string> = {};
  for (const [groupId, group] of Object.entries(registry)) {
    values[groupId] = group.options.map((option) => option.value);
    searchKeys[groupId] = toSearchKey(groupId);
  }
  return [
    '(function(){',
    'try {',
    `var prefix = ${JSON.stringify(OPTION_STORAGE_PREFIX)};`,
    `var values = ${JSON.stringify(values)};`,
    `var searchKeys = ${JSON.stringify(searchKeys)};`,
    'var groupIds = Object.keys(values);',
    'var stored = {};',
    'groupIds.forEach(function(g) {',
    '  try {',
    '    var v = localStorage.getItem(prefix + g);',
    '    if (v) stored[g] = v;',
    '  } catch(e) {}',
    '});',
    'var params = new URLSearchParams(location.search);',
    'groupIds.forEach(function(g) {',
    '  var v = params.get(searchKeys[g]);',
    '  if (v === null) return;',
    '  if (values[g].indexOf(v) === -1) return;',
    '  stored[g] = v;',
    '  try { localStorage.setItem(prefix + g, v); } catch(e) {}',
    '});',
    'var rules = [];',
    'Object.keys(stored).forEach(function(g) {',
    '  var v = stored[g];',
    '  var gs = JSON.stringify(g).slice(1, -1);',
    '  var vs = JSON.stringify(v).slice(1, -1);',
    "  rules.push('[data-switch-group=\"' + gs + '\"] [data-when-value]:not([data-when-value=\"' + vs + '\"]){display:none !important}');",
    "  rules.push('[data-switch-group=\"' + gs + '\"] [data-when-value=\"' + vs + '\"]{display:block !important}');",
    "  rules.push('[data-only-group=\"' + gs + '\"]:not([data-only-value=\"' + vs + '\"]){display:none !important}');",
    "  rules.push('[data-only-group=\"' + gs + '\"][data-only-value=\"' + vs + '\"]{display:block !important}');",
    '});',
    'if (rules.length) {',
    "  var s = document.createElement('style');",
    `  s.id = ${JSON.stringify(OPTION_PREPAINT_STYLE_ID)};`,
    "  s.textContent = rules.join('');",
    '  document.head.appendChild(s);',
    '}',
    '} catch(e) {}',
    '})();',
  ].join('');
}
