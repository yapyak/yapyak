import type {
  Placeholder,
  PlaceholderKind,
  TemplateDiagnostic,
} from '../../template';

import { extractPlaceholders, parseTemplate } from '../../template';

export type { Placeholder, PlaceholderKind, TemplateDiagnostic };

export interface ParsedMessage {
  issues: TemplateDiagnostic[];
  placeholders: Placeholder[];
}

export function parsePlaceholders(source: string): ParsedMessage {
  const { diagnostics, template } = parseTemplate(source);
  if (hasFatalDiagnostic(diagnostics)) {
    return { issues: diagnostics, placeholders: [] };
  }
  return {
    issues: diagnostics,
    placeholders: extractPlaceholders(template),
  };
}

function hasFatalDiagnostic(diagnostics: TemplateDiagnostic[]): boolean {
  return diagnostics.some((diagnostic) => {
    if (diagnostic.reason === 'malformed') {
      return true;
    }
    if (
      diagnostic.reason === 'unsupported' &&
      diagnostic.feature === 'apostrophe escaping'
    ) {
      return true;
    }
    return false;
  });
}
