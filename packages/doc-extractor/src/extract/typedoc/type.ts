export interface ReferenceManifest {
  modules: ReferenceModule[];
  packageName: string;
}

export interface ReferenceModule {
  description: string;
  exports: ReferenceExport[];
  id: string;
  sourcePath: string;
  subpath: string;
}

export type ReferenceExport =
  | ReferenceClass
  | ReferenceFunction
  | ReferenceInterface
  | ReferenceTypeAlias
  | ReferenceVariable;

export interface ReferenceSymbolBase {
  deprecated: string | null;
  description: string;
  examples: ReferenceExample[];
  location: ReferenceLocation;
  name: string;
  remarks: string;
  seeAlso: string[];
  tags: ReferenceTag[];
  throws: ReferenceThrows[];
}

export interface ReferenceExample {
  code: string;
  language: string;
  title: string | null;
}

export interface ReferenceThrows {
  condition: string;
  errorClass: string;
}

export interface ReferenceFunction extends ReferenceSymbolBase {
  kind: 'function';
  members: ReferenceMember[];
  overloads: ReferenceOverload[];
  returnDescription: string;
}

export interface ReferenceOverload {
  parameters: ReferenceParameter[];
  returnType: TypeToken[];
  signature: string;
  typeParameters: ReferenceTypeParameter[];
}

export interface ReferenceTypeParameter {
  constraint: TypeToken[] | null;
  defaultType: TypeToken[] | null;
  description: string;
  name: string;
}

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

export interface ReferenceClass extends ReferenceSymbolBase {
  kind: 'class';
  members: ReferenceMember[];
  signature: string;
}

export interface ReferenceParameter {
  defaultValue: string | null;
  description: string;
  name: string;
  optional: boolean;
  type: TypeToken[];
}

export interface ReferenceMember {
  defaultValue: string | null;
  description: string;
  name: string;
  optional: boolean;
  type: TypeToken[];
}

export interface ReferenceCallSignature {
  parameters: ReferenceParameter[];
  returnType: TypeToken[];
  signature: string;
  typeParameters: ReferenceTypeParameter[];
}

export type TypeToken = TypeRefToken | TypeTextToken;

export interface TypeTextToken {
  kind: 'text';
  text: string;
}

export interface TypeRefToken {
  kind: 'ref';
  module: string;
  name: string;
  text: string;
}

export interface ReferenceLocation {
  column: number;
  file: string;
  line: number;
}

export interface ReferenceTag {
  name: string;
  text: string;
}
