export type ReferenceManifest = {
  modules: ReferenceModule[];
  packageName: string;
};

export type ReferenceModule = {
  description: string;
  exports: ReferenceExport[];
  id: string;
  sourcePath: string;
  subpath: string;
};

export type ReferenceExport =
  | ReferenceClass
  | ReferenceFunction
  | ReferenceInterface
  | ReferenceTypeAlias
  | ReferenceVariable;

export type ReferenceSymbolBase = {
  deprecated: string | null;
  description: string;
  examples: ReferenceExample[];
  location: ReferenceLocation;
  name: string;
  remarks: string;
  seeAlso: string[];
  tags: ReferenceTag[];
  throws: ReferenceThrows[];
};

export type ReferenceExample = {
  code: string;
  language: string;
  path: string | null;
  title: string | null;
};

export type ReferenceThrows = {
  condition: string;
  errorClass: string;
};

export interface ReferenceFunction extends ReferenceSymbolBase {
  kind: 'function';
  members: ReferenceMember[];
  overloads: ReferenceOverload[];
}

export type ReferenceOverload = {
  parameters: ReferenceParameter[];
  returnType: TypeToken[];
  signature: string;
  typeParameters: ReferenceTypeParameter[];
};

export type ReferenceTypeParameter = {
  constraint: TypeToken[] | null;
  defaultType: TypeToken[] | null;
  description: string;
  name: string;
};

export interface ReferenceInterface extends ReferenceSymbolBase {
  callSignatures: ReferenceCallSignature[];
  kind: 'interface';
  members: ReferenceMember[];
  signature: string;
}

export interface ReferenceTypeAlias extends ReferenceSymbolBase {
  kind: 'type';
  resolvedType: TypeToken[];
  signature: string;
}

export interface ReferenceVariable extends ReferenceSymbolBase {
  kind: 'variable';
  type: TypeToken[];
}

interface ReferenceClass extends ReferenceSymbolBase {
  kind: 'class';
  members: ReferenceMember[];
  signature: string;
}

export type ReferenceParameter = {
  defaultValue: string | null;
  description: string;
  name: string;
  optional: boolean;
  type: TypeToken[];
};

export type ReferenceMember = {
  defaultValue: string | null;
  description: string;
  name: string;
  optional: boolean;
  type: TypeToken[];
};

export type ReferenceCallSignature = {
  parameters: ReferenceParameter[];
  returnType: TypeToken[];
  signature: string;
  typeParameters: ReferenceTypeParameter[];
};

export type TypeToken = TypeRefToken | TypeTextToken;

type TypeTextToken = {
  kind: 'text';
  text: string;
};

type TypeRefToken = {
  kind: 'ref';
  module: string;
  name: string;
  text: string;
};

export type ReferenceLocation = {
  column: number;
  file: string;
  line: number;
};

export type ReferenceTag = {
  name: string;
  text: string;
};
