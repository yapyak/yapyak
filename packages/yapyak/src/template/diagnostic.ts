export type TemplateRange = {
  end: number;
  start: number;
};

export type TemplateDiagnostic =
  | {
      message: string;
      range: TemplateRange;
      reason: 'malformed';
    }
  | {
      name: string;
      range: TemplateRange;
      reason: 'missing-other';
    }
  | {
      branch: string;
      name: string;
      pluralKind: 'cardinal' | 'ordinal';
      range: TemplateRange;
      reason: 'unknown-keyword';
    }
  | {
      feature: string;
      name: string;
      range: TemplateRange;
      reason: 'unsupported';
    };
