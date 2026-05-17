import type { ApiExport } from './extract-api.server';

export interface ReferenceSidebar {
  modules: RefModule[];
}

export interface RefModule {
  href: string;
  id: string;
  submodules: RefModule[];
  symbols: RefSymbol[];
}

export interface RefSymbol {
  href: string;
  isDeprecated: boolean;
  kind: ApiExport['kind'];
  name: string;
}
