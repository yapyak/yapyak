export type TemplateRange = {
  end: number;
  start: number;
};

export type MalformedDiagnostic = {
  message: string;
  range: TemplateRange;
  kind: 'malformed';
};

export type TemplateDiagnostic =
  | MalformedDiagnostic
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
    }
  | {
      name: string;
      range: TemplateRange;
      kind: 'invalid-name';
    };
