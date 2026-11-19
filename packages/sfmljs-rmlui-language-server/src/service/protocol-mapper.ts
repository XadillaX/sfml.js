'use strict';

/**
 * Maps framework-neutral parsing results onto LSP protocol types.
 */

import {
  CompletionItem,
  CompletionItemKind,
  Diagnostic,
  DiagnosticSeverity,
  InsertTextFormat,
  MarkupKind,
  Range,
} from 'vscode-languageserver';
import type { TextDocument } from 'vscode-languageserver-textdocument';
import type { PureCompletion, CompletionKind } from '../util/completion';
import type { PureDiagnostic, PureSeverity } from '../util/rcss-parser';
import type { RawRange } from '../util/range';

/**
 * Converts an offset range to an LSP range inside a document.
 *
 * @param document Host text document.
 * @param range Raw offset range.
 * @returns Equivalent LSP range.
 */
export function toLspRange(
  document: TextDocument,
  range: RawRange,
): Range {
  return Range.create(
    document.positionAt(range.start),
    document.positionAt(range.end),
  );
}

/**
 * Maps a pure severity to an LSP diagnostic severity.
 *
 * @param severity Pure severity bucket.
 * @returns Matching LSP severity.
 */
export function toLspSeverity(severity: PureSeverity): DiagnosticSeverity {
  switch (severity) {
    case 'error':
      return DiagnosticSeverity.Error;
    case 'warning':
      return DiagnosticSeverity.Warning;
    default:
      return DiagnosticSeverity.Hint;
  }
}

/**
 * Converts a pure diagnostic to an LSP diagnostic.
 *
 * @param document Host text document.
 * @param pure Pure parser diagnostic.
 * @returns Equivalent LSP diagnostic.
 */
export function toLspDiagnostic(
  document: TextDocument,
  pure: PureDiagnostic,
): Diagnostic {
  const diagnostic: Diagnostic = {
    range: toLspRange(document, pure.range),
    message: pure.message,
    severity: toLspSeverity(pure.severity),
    source: 'rmlui',
  };
  if (pure.code) {
    diagnostic.code = pure.code;
  }
  return diagnostic;
}

/**
 * Maps a pure completion kind to an LSP completion item kind.
 *
 * @param kind Pure completion kind.
 * @returns Matching LSP item kind.
 */
export function toCompletionItemKind(
  kind: CompletionKind,
): CompletionItemKind {
  switch (kind) {
    case 'property':
      return CompletionItemKind.Property;
    case 'value':
    case 'keyword':
      return CompletionItemKind.Value;
    case 'function':
      return CompletionItemKind.Function;
    case 'unit':
      return CompletionItemKind.Unit;
    case 'snippet':
      return CompletionItemKind.Snippet;
    case 'tag':
      return CompletionItemKind.Property;
    case 'attribute':
      return CompletionItemKind.Field;
    case 'class':
      return CompletionItemKind.Class;
    case 'id':
      return CompletionItemKind.Reference;
    case 'pseudo':
      return CompletionItemKind.Enum;
    case 'color':
      return CompletionItemKind.Color;
    case 'variable':
      return CompletionItemKind.Variable;
    default:
      return CompletionItemKind.Text;
  }
}

/**
 * Converts a pure suggestion to an LSP completion item.
 *
 * @param suggestion Pure completion suggestion.
 * @returns LSP completion item.
 */
export function toCompletionItem(
  suggestion: PureCompletion,
): CompletionItem {
  const item: CompletionItem = {
    label: suggestion.label,
    kind: toCompletionItemKind(suggestion.kind),
  };
  if (suggestion.detail) {
    item.detail = suggestion.detail;
  }
  if (suggestion.documentation) {
    item.documentation = {
      kind: MarkupKind.Markdown,
      value: suggestion.documentation,
    };
  }
  if (suggestion.snippet) {
    item.insertTextFormat = InsertTextFormat.Snippet;
    item.insertText = suggestion.snippet;
  }
  return item;
}
