import { buildTools } from './tools.js';
import {
  ErrorCodes,
  type JsonRpcError,
  type JsonRpcRequest,
  type JsonRpcResponse,
  type ToolResult,
} from './types.js';

const PROTOCOL_VERSION = '2024-11-05';
const SERVER_INFO = {
  name: 'yapyak',
  version: '0.0.0',
};

export async function runMcpServer(cwd: string): Promise<void> {
  const { definitions, handlers } = buildTools({ cwd });

  let buffer = '';
  process.stdin.setEncoding('utf-8');

  process.stdin.on('data', (chunk: string) => {
    buffer += chunk;
    let newlineIndex = buffer.indexOf('\n');
    while (newlineIndex !== -1) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (line.length > 0) {
        void handleLine(line);
      }
      newlineIndex = buffer.indexOf('\n');
    }
  });

  process.stdin.on('end', () => {
    process.exit(0);
  });

  async function handleLine(line: string): Promise<void> {
    let request: JsonRpcRequest;
    try {
      request = JSON.parse(line) as JsonRpcRequest;
    } catch {
      writeResponse({
        error: {
          code: ErrorCodes.PARSE_ERROR,
          message: 'Parse error',
        },
        id: null,
        jsonrpc: '2.0',
      });
      return;
    }

    if (request.id === undefined) {
      return;
    }

    try {
      const result = await dispatch(request);
      writeResponse({
        id: request.id,
        jsonrpc: '2.0',
        result,
      });
    } catch (error) {
      const rpcError: JsonRpcError = isJsonRpcError(error)
        ? error
        : {
            code: ErrorCodes.INTERNAL_ERROR,
            message: error instanceof Error ? error.message : String(error),
          };
      writeResponse({
        error: rpcError,
        id: request.id,
        jsonrpc: '2.0',
      });
    }
  }

  async function dispatch(request: JsonRpcRequest): Promise<unknown> {
    switch (request.method) {
      case 'initialize':
        return {
          capabilities: { tools: {} },
          protocolVersion: PROTOCOL_VERSION,
          serverInfo: SERVER_INFO,
        };

      case 'tools/list':
        return { tools: definitions };

      case 'tools/call': {
        const params = (request.params ?? {}) as {
          arguments?: Record<string, unknown>;
          name?: string;
        };
        const name = params.name;
        if (!name) {
          throw {
            code: ErrorCodes.INVALID_PARAMS,
            message: 'tools/call requires a name parameter',
          };
        }
        const handler = handlers[name];
        if (!handler) {
          throw {
            code: ErrorCodes.METHOD_NOT_FOUND,
            message: `Unknown tool: ${name}`,
          };
        }
        const result: ToolResult = await handler(params.arguments ?? {});
        return result;
      }

      case 'notifications/initialized':
        return undefined;

      case 'ping':
        return {};

      default:
        throw {
          code: ErrorCodes.METHOD_NOT_FOUND,
          message: `Method not found: ${request.method}`,
        };
    }
  }
}

function writeResponse(response: JsonRpcResponse): void {
  process.stdout.write(`${JSON.stringify(response)}\n`);
}

function isJsonRpcError(value: unknown): value is JsonRpcError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    typeof (value as JsonRpcError).code === 'number' &&
    typeof (value as JsonRpcError).message === 'string'
  );
}
