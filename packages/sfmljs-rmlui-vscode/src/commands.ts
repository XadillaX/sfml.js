'use strict';

import * as vscode from 'vscode';

/** URLs opened by the RmlUi command palette entries. */
const DOC_URLS = {
  rml: 'https://mikke89.github.io/RmlUiDoc/pages/rml.html',
  rcss: 'https://mikke89.github.io/RmlUiDoc/pages/rcss.html',
  properties:
    'https://mikke89.github.io/RmlUiDoc/pages/rcss/property_index.html',
  dataBindings:
    'https://mikke89.github.io/RmlUiDoc/pages/data_bindings.html',
} as const;

/**
 * Registers commands that open sections of the official RmlUi manual.
 *
 * @param context Extension subscription context.
 */
export function registerDocCommands(context: vscode.ExtensionContext): void {
  const entries: Array<[ string, string ]> = [
    [ 'rmlui.openDocsRml', DOC_URLS.rml ],
    [ 'rmlui.openDocsRcss', DOC_URLS.rcss ],
    [ 'rmlui.openDocsProperties', DOC_URLS.properties ],
    [ 'rmlui.openDocsDataBindings', DOC_URLS.dataBindings ],
  ];
  for (const [ command, url ] of entries) {
    const disposable = vscode.commands.registerCommand(command, () =>
      vscode.env.openExternal(vscode.Uri.parse(url)));
    context.subscriptions.push(disposable);
  }
}
