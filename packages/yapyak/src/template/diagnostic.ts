export type TemplateRange = {
  end: number;
  start: number;
};

export type TemplateDiagnostic =
  | {
      message: string;
      range: TemplateRange;
      kind: 'malformed';
    }
  | {
      name: string;
      range: TemplateRange;
      kind: 'missing-other';
    }
  | {
      branch: string;
      name: string;
      pluralKind: 'cardinal' | 'ordinal';
      range: TemplateRange;
      kind: 'unknown-keyword';
    }
  | {
      feature: string;
      name: string;
      range: TemplateRange;
      kind: 'unsupported';
    };
