export interface JsonRpcRequest {
  id?: number | string;
  jsonrpc: '2.0';
  method: string;
  params?: unknown;
}

export interface JsonRpcResponse {
  error?: JsonRpcError;
  id: number | string | null;
  jsonrpc: '2.0';
  result?: unknown;
}

export interface JsonRpcError {
  code: number;
  data?: unknown;
  message: string;
}

export interface JsonRpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: unknown;
}

export const ErrorCodes = {
  INTERNAL_ERROR: -32603,
  INVALID_PARAMS: -32602,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  PARSE_ERROR: -32700,
} as const;

export interface ToolDefinition {
  description: string;
  inputSchema: {
    properties?: Record<string, unknown>;
    required?: string[];
    type: 'object';
  };
  name: string;
}

export interface ToolResult {
  content: Array<{ text: string; type: 'text' }>;
  isError?: boolean;
}

export type ToolHandler = (args: Record<string, unknown>) => Promise<ToolResult>;
