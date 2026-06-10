export interface TemplateRange {
  end: number;
  start: number;
}

export type TemplateDiagnostic =
  | { message: string; range: TemplateRange; reason: 'malformed' }
  | { name: string; range: TemplateRange; reason: 'missing-other' }
  | {
      feature: string;
      name: string;
      range: TemplateRange;
      reason: 'unsupported';
    };
