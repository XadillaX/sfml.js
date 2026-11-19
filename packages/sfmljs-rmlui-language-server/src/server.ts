'use strict';

/**
 * RmlUi language server entry point.
 *
 * Speaks LSP over stdio and serves RML and RCSS documents: completion,
 * hover, diagnostics, color information/presentations and document links.
 * All parsing lives in the framework-neutral util/ and service/ modules.
 */

import { fileURLToPath } from 'node:url';
import {
  Color,
  ColorInformation,
  ColorPresentation,
  CompletionItem,
  createConnection,
  DiagnosticSeverity,
  DocumentLink,
  Hover,
  InitializeParams,
  InitializeResult,
  MarkupKind,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { getTagMeta } from './meta/rml-meta';
import { hoverRcss, hoverRml } from './service/hover-builder';
import {
  toCompletionItem,
  toLspDiagnostic,
  toLspRange,
} from './service/protocol-mapper';
import { FsWorkspaceIndex } from './service/workspace-index';
import {
  findColors,
  formatHex,
  formatRgba,
} from './util/color';
import { completeRcss, completeRml } from './util/completion';
import {
  getRcssCompletionContext,
  parseRcss,
} from './util/rcss-parser';
import {
  getRmlCompletionContext,
  parseRml,
} from './util/rml-parser';

/** Client-provided feature toggles matching the extension settings. */
export interface RmlUiServerSettings {
  /** Report unknown RCSS property names. */
  unknownRcssProperties: boolean;
  /** Report non-built-in RML tags as hints. */
  unknownRmlTags: boolean;
  /** Report unknown RCSS pseudo-classes. */
  unknownPseudoClasses: boolean;
  /** Index workspace RML ids and classes for selector completion. */
  suggestWorkspaceIdsAndClasses: boolean;
}

const DEFAULT_SETTINGS: RmlUiServerSettings = {
  unknownRcssProperties: true,
  unknownRmlTags: true,
  unknownPseudoClasses: true,
  suggestWorkspaceIdsAndClasses: true,
};

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);
const index = new FsWorkspaceIndex();
let settings: RmlUiServerSettings = DEFAULT_SETTINGS;

connection.onInitialize((params: InitializeParams): InitializeResult => {
  const roots = resolveRoots(params);
  void index.setRoots(roots);
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        triggerCharacters: [ '<', ' ', '"', "'", '-', '.', '#', ':', '@' ],
        resolveProvider: false,
      },
      hoverProvider: true,
      colorProvider: true,
      documentLinkProvider: {
        resolveProvider: false,
      },
    },
  };
});

connection.onInitialized(() => {
  connection.console.info('RmlUi language server initialized');
});

connection.onDidChangeConfiguration(change => {
  const received = change.settings?.rmlui as
    Partial<RmlUiServerSettings> | undefined;
  if (received) {
    settings = { ...DEFAULT_SETTINGS, ...received };
  }
  if (!settings.suggestWorkspaceIdsAndClasses) {
    void index.setRoots([]);
  }
  for (const document of documents.all()) {
    void validate(document);
  }
});

documents.onDidChangeContent(change => {
  void validate(change.document);
  index.scheduleRebuild();
});

documents.onDidClose(event => {
  connection.sendDiagnostics({ uri: event.document.uri, diagnostics: [] });
});

connection.onDidChangeWatchedFiles(() => {
  index.scheduleRebuild();
});

connection.onCompletion((params): CompletionItem[] => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return [];
  }
  const text = document.getText();
  const offset = document.offsetAt(params.position);
  const symbols = settings.suggestWorkspaceIdsAndClasses
    ? index.getSymbols()
    : { ids: [], classes: [] };

  if (document.languageId === 'rcss') {
    const context = getRcssCompletionContext(text, offset);
    const custom = parseRcss(text).customProperties;
    return completeRcss(context, symbols, custom).map(toCompletionItem);
  }
  const context = getRmlCompletionContext(text, offset);
  return completeRml(context, symbols).map(toCompletionItem);
});

connection.onHover(params => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return null;
  }
  const offset = document.offsetAt(params.position);
  const result = document.languageId === 'rcss'
    ? hoverRcss(document.getText(), offset)
    : hoverRml(document.getText(), offset);
  if (!result) {
    return null;
  }
  const hover: Hover = {
    contents: {
      kind: MarkupKind.Markdown,
      value: result.markdown,
    },
    range: toLspRange(document, result.range),
  };
  return hover;
});

connection.onDocumentColor(params => {
  const document = documents.get(params.textDocument.uri);
  if (!document || document.languageId !== 'rcss') {
    return [];
  }
  return findColors(document.getText()).map(entry => {
    const info: ColorInformation = {
      range: toLspRange(document, entry.range),
      color: Color.create(
        entry.color.r / 255,
        entry.color.g / 255,
        entry.color.b / 255,
        entry.color.a,
      ),
    };
    return info;
  });
});

connection.onColorPresentation(params => {
  const color = params.color;
  const rgba = {
    r: color.red * 255,
    g: color.green * 255,
    b: color.blue * 255,
    a: color.alpha,
  };
  return [
    ColorPresentation.create(formatHex(rgba)),
    ColorPresentation.create(formatRgba(rgba)),
  ];
});

connection.onDocumentLinks(params => {
  const document = documents.get(params.textDocument.uri);
  if (!document || document.languageId !== 'rml') {
    return [];
  }
  const parsed = parseRml(document.getText());
  const links: DocumentLink[] = [];
  for (const link of parsed.links) {
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(link.target)) {
      continue;
    }
    try {
      const target = new URL(link.target, `${document.uri}/`);
      links.push({
        range: toLspRange(document, link.range),
        target: target.href,
      });
    } catch {
      // Skip malformed relative references.
    }
  }
  return links;
});

documents.listen(connection);
connection.listen();

/**
 * Extracts filesystem workspace roots from initialization parameters.
 *
 * @param params Initialize parameters sent by the client.
 * @returns Absolute filesystem paths.
 */
function resolveRoots(params: InitializeParams): string[] {
  const folders = params.workspaceFolders ?? [];
  const roots: string[] = [];
  for (const folder of folders) {
    if (!folder.uri.startsWith('file://')) {
      continue;
    }
    roots.push(fileURLToPath(folder.uri));
  }
  const optionRoots = params.initializationOptions?.workspaceRoots;
  if (Array.isArray(optionRoots)) {
    for (const root of optionRoots) {
      if (typeof root === 'string' && !roots.includes(root)) {
        roots.push(root);
      }
    }
  }
  return roots;
}

/**
 * Publishes diagnostics for one document according to the active settings.
 *
 * @param document Open text document.
 */
async function validate(document: TextDocument): Promise<void> {
  const text = document.getText();
  if (document.languageId === 'rcss') {
    const parsed = parseRcss(text);
    const diagnostics = parsed.diagnostics
      .filter(item => filterBySettings(item.code))
      .map(item => toLspDiagnostic(document, item));
    connection.sendDiagnostics({ uri: document.uri, diagnostics });
    return;
  }

  const parsed = parseRml(text);
  const diagnostics = parsed.diagnostics.map(item =>
    toLspDiagnostic(document, item));
  if (settings.unknownRmlTags) {
    for (const element of parsed.elements) {
      if (getTagMeta(element.tag)) {
        continue;
      }
      diagnostics.push({
        range: toLspRange(document, element.nameRange),
        message: `"<${element.tag}>" is not a built-in RmlUi element. ` +
          'Custom element instancers may still provide it.',
        severity: DiagnosticSeverity.Hint,
        source: 'rmlui',
      });
    }
  }
  connection.sendDiagnostics({ uri: document.uri, diagnostics });
}

/**
 * Checks whether a diagnostic code is enabled by the current settings.
 *
 * @param code Diagnostic code from the parser.
 * @returns True when the diagnostic should be published.
 */
function filterBySettings(code: string | number | undefined): boolean {
  if (code === 'rcss-unknown-property') {
    return settings.unknownRcssProperties;
  }
  if (code === 'rcss-unknown-pseudo-class') {
    return settings.unknownPseudoClasses;
  }
  return true;
}
