import type { OptionsRegistry } from '@yapyak/docs-compiler';

export const OPTION_STORAGE_PREFIX = 'yapyak.option.';
export const OPTION_PREPAINT_STYLE_ID = 'yapyak-options-prepaint';

declare global {
  // biome-ignore lint/style/useConsistentTypeDefinitions: yap yap yap
  interface Window {
    __yapyakOptions?: Record<string, string>;
  }
}

export function buildPrepaintScript(registry: OptionsRegistry): string {
  const groupIds = Object.keys(registry);
  return [
    '(function(){',
    'try {',
    `var prefix = ${JSON.stringify(OPTION_STORAGE_PREFIX)};`,
    `var groupIds = ${JSON.stringify(groupIds)};`,
    'var stored = {};',
    'groupIds.forEach(function(g) {',
    '  try {',
    '    var v = localStorage.getItem(prefix + g);',
    '    if (v) stored[g] = v;',
    '  } catch(e) {}',
    '});',
    'window.__yapyakOptions = stored;',
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
