'use strict';

import * as path from 'node:path';
import * as vscode from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node';
import { registerDocCommands } from './commands';

let client: LanguageClient | undefined;

/**
 * Activates the extension by launching the bundled RmlUi language server.
 *
 * @param context Extension context managing subscriptions.
 */
export function activate(context: vscode.ExtensionContext): void {
  const serverModule = context.asAbsolutePath(
    path.join('dist', 'server', 'server.js'),
  );
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: { execArgv: [ '--nolazy', '--inspect=6099' ] },
    },
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [
      { scheme: 'file', language: 'rml' },
      { scheme: 'file', language: 'rcss' },
      { scheme: 'untitled', language: 'rml' },
      { scheme: 'untitled', language: 'rcss' },
    ],
    synchronize: {
      fileEvents: [
        vscode.workspace.createFileSystemWatcher('**/*.rml'),
        vscode.workspace.createFileSystemWatcher('**/*.rcss'),
      ],
      configurationSection: 'rmlui',
    },
    initializationOptions: {
      workspaceRoots: vscode.workspace.workspaceFolders?.map(
        folder => folder.uri.fsPath,
      ) ?? [],
    },
  };

  client = new LanguageClient(
    'rmlui',
    'RmlUi Language Server',
    serverOptions,
    clientOptions,
  );
  context.subscriptions.push({
    dispose: () => {
      void client?.stop();
    },
  });
  context.subscriptions.push(
    vscode.commands.registerCommand('rmlui.restartLanguageServer', () => {
      void client?.restart();
    }),
  );
  registerDocCommands(context);
  void client.start();
}

/**
 * Stops the language client when the extension deactivates.
 *
 * @returns Stop promise or undefined when no client is running.
 */
export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
