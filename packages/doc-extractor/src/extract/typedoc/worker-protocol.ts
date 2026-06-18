import type { PackageContext } from './package-context';
import type { ReferenceManifest } from './type';

export type WorkerRequest = {
  context: PackageContext;
  packageDir: string;
  subpaths?: string[];
};

export type WorkerResponse =
  | {
      manifest: ReferenceManifest;
      ok: true;
    }
  | {
      error: {
        message: string;
        stack?: string;
      };
      ok: false;
    };
