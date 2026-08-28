import type { NitroAppPlugin } from 'nitropack/types';

import { appendResponseHeader, getRequestURL } from 'h3';
import { defineNitroPlugin } from 'nitropack/runtime';
import { withResponse } from 'yapyak/adapter';
import { readPendingResponseHeaders } from 'yapyak/adapter/internal';

const nitro: NitroAppPlugin = defineNitroPlugin((nitroApp) => {
  const handler = nitroApp.h3App.handler;
  nitroApp.h3App.handler = (event) => {
    const { res } = event.node;
    let responseHeaders: Headers | undefined;
    const writeHead = res.writeHead.bind(res);
    res.writeHead = ((...args: Parameters<typeof writeHead>) => {
      if (responseHeaders !== undefined && !res.headersSent) {
        for (const [name, value] of responseHeaders) {
          appendResponseHeader(event, name, value);
        }
        responseHeaders = undefined;
      }
      return writeHead(...args);
    }) as typeof res.writeHead;
    return withResponse(
      new Request(getRequestURL(event), {
        headers: event.headers,
      }),
      () => {
        responseHeaders = readPendingResponseHeaders();
        return handler(event);
      },
      () => new Response(null),
    );
  };
});

export default nitro;
