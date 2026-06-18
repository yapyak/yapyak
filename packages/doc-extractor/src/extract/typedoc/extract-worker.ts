import type { WorkerRequest, WorkerResponse } from './worker-protocol';

import { extractTypedoc } from './extract';

if (process.send === undefined) {
  throw new Error(
    '@yapyak/doc-extractor extract-worker must run as a forked child with an IPC channel',
  );
}

process.on('message', (raw: unknown) => {
  void handle(raw as WorkerRequest);
});

async function handle(request: WorkerRequest): Promise<void> {
  let response: WorkerResponse;
  try {
    const manifest = await extractTypedoc(request.packageDir, request.context, {
      subpaths: request.subpaths,
    });
    response = {
      manifest,
      ok: true,
    };
  } catch (cause) {
    const error = cause instanceof Error ? cause : new Error(String(cause));
    response = {
      error: {
        message: error.message,
        stack: error.stack,
      },
      ok: false,
    };
  }
  await sendResponse(response);
  process.exit(response.ok ? 0 : 1);
}

function sendResponse(response: WorkerResponse): Promise<void> {
  return new Promise((resolve, reject) => {
    process.send!(response, undefined, undefined, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}
