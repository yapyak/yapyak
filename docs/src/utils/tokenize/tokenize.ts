import type { Language, Token } from './type';

import { tokenizeBash } from './bash';
import { tokenizeDiff } from './diff';
import { tokenizeHtml } from './html';
import { tokenizeJson } from './json';
import { reclassifyJsxText } from './jsx-text';
import { mergePlainTokens } from './plain-token';
import { markTaggedTemplates } from './tagged-template';
import { expandTemplateInterpolations } from './template-interpolation';
import { scanToken } from './token';
import { tokenizeTranslation } from './translation';
import { expandTxSourcePlaceholders } from './tx-icu';
import { expandTxSourceTags } from './tx-tag';
import { applyTypePositions } from './type-position';
import { expandVueAttributeBindings } from './vue-attribute-binding';
import { tokenizeYaml } from './yaml';
import { applyYapyakHighlight } from './yapyak-highlight';

export function tokenize(code: string, language: Language): Token[] {
  if (language === 'diff') {
    return tokenizeDiff(code);
  }
  if (language === 'bash') {
    return tokenizeBash(code);
  }
  if (language === 'html') {
    return tokenizeHtml(code);
  }
  if (language === 'yaml') {
    return tokenizeYaml(code);
  }
  if (language === 'json') {
    return tokenizeJson(code);
  }
  if (language === 'translation') {
    return expandTxSourceTags(
      expandTxSourcePlaceholders(tokenizeTranslation(code)),
    );
  }
  const tokens: Token[] = [];
  let index = 0;
  let lastSignificant: Token | undefined;
  while (index < code.length) {
    const result = scanToken(code, index, language, lastSignificant);
    if (result === undefined) {
      const fallback: Token = {
        type: 'plain',
        value: code[index] ?? '',
      };
      tokens.push(fallback);
      if (!/^\s+$/.test(fallback.value)) {
        lastSignificant = fallback;
      }
      index++;
    } else {
      tokens.push(result.token);
      if (result.token.type !== 'plain' || !/^\s+$/.test(result.token.value)) {
        lastSignificant = result.token;
      }
      index = result.end;
    }
  }
  applyYapyakHighlight(tokens);
  applyTypePositions(tokens);
  markTaggedTemplates(tokens);
  reclassifyJsxText(tokens);
  const vueExpanded =
    language === 'vue' ? expandVueAttributeBindings(tokens, tokenize) : tokens;
  const templateExpanded = expandTemplateInterpolations(
    vueExpanded,
    language,
    tokenize,
  );
  const icuExpanded = expandTxSourcePlaceholders(templateExpanded);
  const tagExpanded = expandTxSourceTags(icuExpanded);
  return mergePlainTokens(tagExpanded);
}
