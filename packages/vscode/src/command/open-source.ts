import { Range, Uri, window, workspace } from 'vscode';

import { resolveProject } from '../core';
import { join } from 'node:path';

export type OpenSourceRequest = {
  context?: string;
  fileId: string;
  root: string;
  source: string;
};

export function createOpenSourceCommand(): (
  request: OpenSourceRequest | undefined,
) => Promise<void> {
  return async (request) => {
    if (request?.root === undefined) {
      return;
    }
    const path = join(request.root, request.fileId);
    let document: Awaited<ReturnType<typeof workspace.openTextDocument>>;
    try {
      document = await workspace.openTextDocument(Uri.file(path));
    } catch {
      window.showErrorMessage(`yapyak: could not open ${request.fileId}.`);
      return;
    }
    const project = await resolveProject(request.root);
    if (project === undefined) {
      return;
    }
    const { messages } = project.compiler.extractFile(
      request.fileId,
      document.getText(),
      {
        processors: project.config.processors,
      },
    );
    const message = messages.find(
      (candidate) =>
        candidate.source === request.source &&
        candidate.context === request.context,
    );
    const start = message?.locations[0]?.range.start;
    const position =
      start === undefined
        ? document.positionAt(0)
        : document.positionAt(start.offset);
    await window.showTextDocument(document, {
      selection: new Range(position, position),
    });
  };
}
