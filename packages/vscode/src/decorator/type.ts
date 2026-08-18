import type { TextEditor } from 'vscode';

export type Decorator = {
  dispose: () => void;
  render: (editor: TextEditor | undefined) => void;
};
