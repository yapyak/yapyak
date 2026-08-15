import type {
  MalformedDiagnostic,
  Placeholder,
  TemplateDiagnostic,
} from '../template';

import { extractPlaceholders, parseTemplate } from '../template';

export type { MalformedDiagnostic, Placeholder, TemplateDiagnostic };

export type ParsedMessage = {
  issues: TemplateDiagnostic[];
  placeholders: Placeholder[];
};

export function parsePlaceholders(source: string): ParsedMessage {
  const { diagnostics, template } = parseTemplate(source);
  if (hasFatalDiagnostic(diagnostics)) {
    return {
      issues: diagnostics,
      placeholders: [],
    };
  }
  return {
    issues: diagnostics,
    placeholders: extractPlaceholders(template),
  };
}

export function findMalformedIssue(
  issues: TemplateDiagnostic[],
): MalformedDiagnostic | undefined {
  return issues.find(
    (issue): issue is MalformedDiagnostic => issue.kind === 'malformed',
  );
}

function hasFatalDiagnostic(diagnostics: TemplateDiagnostic[]): boolean {
  return diagnostics.some(
    (diagnostic) =>
      diagnostic.kind === 'unsupported' &&
      diagnostic.feature === 'apostrophe escaping',
  );
}
