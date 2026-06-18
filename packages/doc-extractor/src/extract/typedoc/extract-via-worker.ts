import type { ReferenceManifest } from './type';
import type { WorkerRequest, WorkerResponse } from './worker-protocol';

import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const WORKER_PATH = fileURLToPath(
  new URL('./extract-worker.js', import.meta.url),
);

/**
 * Runs `extractTypedoc` for a single package in an isolated Node subprocess.
 *
 * Each call spawns a child process that loads TypeDoc, extracts the manifest,
 * and exits. The OS reclaims every byte of memory the child held — bounding
 * peak memory to a single package's footprint instead of the sum across all
 * packages.
 */
export function extractTypedocViaWorker(
  request: WorkerRequest,
): Promise<ReferenceManifest> {
  return new Promise<ReferenceManifest>((resolve, reject) => {
    const child = fork(WORKER_PATH, [], {
      execArgv: process.execArgv,
      stdio: [
        'inherit',
        'inherit',
        'inherit',
        'ipc',
      ],
    });

    let settled = false;

    const settle = (fn: () => void): void => {
      if (settled) {
        return;
      }
      settled = true;
      child.removeAllListeners('message');
      child.removeAllListeners('exit');
      child.removeAllListeners('error');
      fn();
    };

    child.on('message', (raw: unknown) => {
      const response = raw as WorkerResponse;
      settle(() => {
        if (response.ok) {
          resolve(response.manifest);
        } else {
          const error = new Error(response.error.message);
          if (response.error.stack !== undefined) {
            error.stack = response.error.stack;
          }
          reject(error);
        }
      });
    });

    child.on('exit', (code, signal) => {
      settle(() => {
        const reason =
          signal === null ? `exit code ${code ?? 0}` : `signal ${signal}`;
        reject(
          new Error(
            `Typedoc worker exited before responding (${reason}) for ${request.packageDir}`,
          ),
        );
      });
    });

    child.on('error', (err) => {
      settle(() => reject(err));
    });

    child.send(request, (err) => {
      if (err) {
        settle(() => reject(err));
      }
    });
  });
}
