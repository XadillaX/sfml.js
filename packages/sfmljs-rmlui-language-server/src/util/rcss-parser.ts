'use strict';

/**
 * Hand-written RCSS parser used by completion, hover and diagnostics.
 *
 * The parser is intentionally lightweight: RmlUi RCSS has no nested rules,
 * so a brace-stack scan with comment/string skipping is sufficient. It never
 * imports the vscode API and can run under plain Node.js.
 */

import {
  getPropertyMeta,
  getPseudoMeta,
  isKnownProperty,
} from '../meta/rcss-meta';
import { contains, prefixAt, type RawRange } from './range';

/** Diagnostic severities independent of the vscode API. */
export type PureSeverity = 'error' | 'warning' | 'hint';

/** A diagnostic produced without depending on vscode types. */
export interface PureDiagnostic {
  /** Source range of the problem. */
  range: RawRange;
  /** Human-readable message. */
  message: string;
  /** Severity bucket. */
  severity: PureSeverity;
  /** Stable diagnostic code. */
  code: string;
}

/** One property declaration inside a rule block. */
export interface RcssDeclaration {
  /** Property name. */
  name: string;
  /** Range covering the property name. */
  nameRange: RawRange;
  /** Raw declaration value. */
  value: string;
  /** Range covering the value. */
  valueRange: RawRange;
  /** Range covering the full declaration. */
  range: RawRange;
  /** At-rule name when the declaration lives directly inside one. */
  atRuleScope: string | null;
}

/** Pseudo-class reference found in a selector. */
export interface PseudoReference {
  /** Pseudo-class name without the colon. */
  name: string;
  /** Range of the name token. */
  range: RawRange;
}

/** Full parse result of an RCSS document. */
export interface RcssParseResult {
  /** All declarations in source order. */
  declarations: RcssDeclaration[];
  /** Parser diagnostics. */
  diagnostics: PureDiagnostic[];
  /** Custom property names declared via --name. */
  customProperties: string[];
  /** Pseudo-class references collected from selectors. */
  pseudoReferences: PseudoReference[];
}

/** Completion context at a caret position. */
export type RcssCompletionContext =
  | { kind: 'none' }
  | {
    kind: 'at-rule';
    prefix: string;
    range: RawRange;
  }
  | {
    kind: 'selector';
    prefix: string;
    range: RawRange;
  }
  | {
    kind: 'property';
    prefix: string;
    range: RawRange;
    atRuleScope: string | null;
  }
  | {
    kind: 'value';
    property: string;
    prefix: string;
    range: RawRange;
  };

interface BraceFrame {
  /** Offset of the opening brace. */
  open: number;
  /** True for at-rule blocks, false for rule blocks. */
  isAtRule: boolean;
  /** At-rule name for at-rule blocks. */
  atRuleName: string | null;
  /** Start of the selector or at-rule prelude. */
  preludeStart: number;
}

/**
 * Skips a comment beginning at the slash offset.
 *
 * @param text Document text.
 * @param start Offset of the opening slash.
 * @returns Offset after the closing token, or end of document.
 */
function skipComment(text: string, start: number): number {
  const end = text.indexOf('*/', start + 2);
  return end === -1 ? text.length : end + 2;
}

/**
 * Skips a quoted string beginning at the quote offset.
 *
 * @param text Document text.
 * @param start Offset of the opening quote.
 * @returns Offset after the closing quote.
 */
function skipString(text: string, start: number): number {
  const quote = text[start];
  let i = start + 1;
  while (i < text.length) {
    if (text[i] === '\\') {
      i += 2;
      continue;
    }
    if (text[i] === quote) {
      return i + 1;
    }
    i += 1;
  }
  return text.length;
}

/**
 * Parses a complete RCSS document.
 *
 * @param text Document text.
 * @returns Declarations, references and diagnostics.
 */
export function parseRcss(text: string): RcssParseResult {
  const declarations: RcssDeclaration[] = [];
  const diagnostics: PureDiagnostic[] = [];
  const customProperties: string[] = [];
  const pseudoReferences: PseudoReference[] = [];
  const stack: BraceFrame[] = [];
  let segmentStart = 0;
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    if (char === '/' && text[i + 1] === '*') {
      i = skipComment(text, i);
      continue;
    }
    if (char === '"' || char === "'") {
      i = skipString(text, i);
      continue;
    }
    if (char === '{') {
      const prelude = text.slice(segmentStart, i);
      const frame = openFrame(prelude, segmentStart, i);
      collectPseudoReferences(
        prelude,
        segmentStart,
        frame.isAtRule,
        pseudoReferences,
        diagnostics,
      );
      stack.push(frame);
      i += 1;
      segmentStart = i;
      continue;
    }
    if (char === '}') {
      const frame = stack.pop();
      if (!frame) {
        diagnostics.push({
          range: { start: i, end: i + 1 },
          message: "Unmatched '}' without an opening block.",
          severity: 'error',
          code: 'rcss-unmatched-brace',
        });
      } else {
        parseSegment(
          text,
          segmentStart,
          i,
          frame,
          declarations,
          customProperties,
          diagnostics,
        );
      }
      i += 1;
      segmentStart = i;
      continue;
    }
    if (char === ';') {
      const frame = stack[stack.length - 1];
      if (frame && !frame.isAtRule) {
        parseSegment(
          text,
          segmentStart,
          i,
          frame,
          declarations,
          customProperties,
          diagnostics,
        );
      }
      i += 1;
      segmentStart = i;
      continue;
    }
    i += 1;
  }

  for (const frame of stack) {
    diagnostics.push({
      range: { start: frame.open, end: frame.open + 1 },
      message: 'Unclosed block; expected a matching "}".',
      severity: 'error',
      code: 'rcss-unclosed-block',
    });
  }

  return {
    declarations,
    diagnostics,
    customProperties,
    pseudoReferences,
  };
}

/**
 * Creates a brace frame from the prelude text before an opening brace.
 *
 * @param prelude Selector or at-rule prelude.
 * @param preludeStart Offset of the prelude start.
 * @param braceOffset Offset of the opening brace.
 * @returns Initialized brace frame.
 */
function openFrame(
  prelude: string,
  preludeStart: number,
  braceOffset: number,
): BraceFrame {
  const atMatch = /@([\w-]+)/.exec(prelude);
  return {
    open: braceOffset,
    isAtRule: Boolean(atMatch),
    atRuleName: atMatch ? atMatch[1].toLowerCase() : null,
    preludeStart,
  };
}

/**
 * Indexes pseudo-classes in a selector prelude and reports unknown names.
 *
 * @param prelude Selector prelude text.
 * @param preludeStart Offset of the prelude start.
 * @param isAtRule True when the prelude belongs to an at-rule.
 * @param references Sink receiving pseudo-class references.
 * @param diagnostics Sink receiving parser diagnostics.
 */
function collectPseudoReferences(
  prelude: string,
  preludeStart: number,
  isAtRule: boolean,
  references: PseudoReference[],
  diagnostics: PureDiagnostic[],
): void {
  if (isAtRule) {
    return;
  }
  const pattern = /:([a-zA-Z-]+)(\([^)]*\))?/g;
  for (const match of prelude.matchAll(pattern)) {
    const name = match[1];
    const range = {
      start: preludeStart + (match.index ?? 0) + 1,
      end: preludeStart + (match.index ?? 0) + 1 + name.length,
    };
    references.push({ name, range });
    if (!getPseudoMeta(name)) {
      diagnostics.push({
        range,
        message: `Unknown RCSS pseudo-class ":${name}".`,
        severity: 'warning',
        code: 'rcss-unknown-pseudo-class',
      });
    }
  }
}

/**
 * Parses one declaration segment and records property diagnostics.
 *
 * @param text Document text.
 * @param start Segment start offset.
 * @param end Segment end offset.
 * @param frame Brace frame enclosing the segment.
 * @param declarations Sink receiving parsed declarations.
 * @param customProperties Sink receiving custom property names.
 * @param diagnostics Sink receiving parser diagnostics.
 */
function parseSegment(
  text: string,
  start: number,
  end: number,
  frame: BraceFrame,
  declarations: RcssDeclaration[],
  customProperties: string[],
  diagnostics: PureDiagnostic[],
): void {
  const segment = text.slice(start, end);
  const colon = segment.indexOf(':');
  if (colon === -1 || frame.isAtRule) {
    return;
  }
  const name = segment.slice(0, colon).trim();
  if (!/^-?[\w-]+$/.test(name)) {
    return;
  }
  const nameStart = start + segment.indexOf(name);
  const nameRange = { start: nameStart, end: nameStart + name.length };
  const valueStart = start + colon + 1;
  const value = text.slice(valueStart, end).trim();
  const valueOffset = valueStart + segment.slice(colon + 1).indexOf(value);
  const valueRange = {
    start: valueOffset,
    end: valueOffset + value.length,
  };

  declarations.push({
    name,
    nameRange,
    value,
    valueRange,
    range: { start, end },
    atRuleScope: frame.atRuleName,
  });

  if (name.startsWith('--')) {
    customProperties.push(name);
    return;
  }
  if (!isKnownProperty(name)) {
    diagnostics.push({
      range: nameRange,
      message: `Unknown RCSS property "${name}".`,
      severity: 'warning',
      code: 'rcss-unknown-property',
    });
  }
}

/**
 * Determines the completion context at a caret offset.
 *
 * @param text Document text.
 * @param offset Caret offset.
 * @returns Context describing what should be suggested.
 */
export function getRcssCompletionContext(
  text: string,
  offset: number,
): RcssCompletionContext {
  const frame = frameAt(text, offset);
  const bounds = segmentBounds(text, offset);
  const segment = text.slice(bounds.start, offset);
  const word = prefixAt(text, offset);

  if (!frame) {
    const trimmed = segment.trimStart();
    if (trimmed.startsWith('@')) {
      return { kind: 'at-rule', ...word };
    }
    return { kind: 'selector', ...word };
  }

  const colon = segment.indexOf(':');
  if (colon === -1) {
    return {
      kind: 'property',
      ...word,
      atRuleScope: frame.isAtRule ? frame.atRuleName : null,
    };
  }

  const property = segment.slice(0, colon).trim();
  return { kind: 'value', property, ...word };
}

/**
 * Finds the innermost brace frame enclosing an offset.
 *
 * @param text Document text.
 * @param offset Caret offset.
 * @returns Enclosing frame, or undefined at the top level.
 */
function frameAt(
  text: string,
  offset: number,
): BraceFrame | undefined {
  const stack: BraceFrame[] = [];
  let segmentStart = 0;
  let i = 0;
  while (i < offset && i < text.length) {
    const char = text[i];
    if (char === '/' && text[i + 1] === '*') {
      i = skipComment(text, i);
      continue;
    }
    if (char === '"' || char === "'") {
      i = skipString(text, i);
      continue;
    }
    if (char === '{') {
      stack.push(openFrame(text.slice(segmentStart, i), segmentStart, i));
      i += 1;
      segmentStart = i;
      continue;
    }
    if (char === '}') {
      stack.pop();
      i += 1;
      segmentStart = i;
      continue;
    }
    if (char === ';') {
      i += 1;
      segmentStart = i;
      continue;
    }
    i += 1;
  }
  return stack[stack.length - 1];
}

/**
 * Returns the bounds of the declaration segment at an offset.
 *
 * @param text Document text.
 * @param offset Caret offset.
 * @returns Range from the last segment delimiter to the caret.
 */
function segmentBounds(
  text: string,
  offset: number,
): RawRange {
  let start = 0;
  for (let i = offset - 1; i >= 0; i -= 1) {
    const char = text[i];
    if (char === '{' || char === '}' || char === ';') {
      start = i + 1;
      break;
    }
  }
  return { start, end: offset };
}

/**
 * Finds the declaration whose property name contains an offset.
 *
 * @param parse Parsed document.
 * @param offset Caret offset.
 * @returns Matching declaration or undefined.
 */
export function declarationAt(
  parse: RcssParseResult,
  offset: number,
): RcssDeclaration | undefined {
  return parse.declarations.find(item => contains(item.nameRange, offset));
}

/**
 * Returns the property metadata for a declaration, validating the name.
 *
 * @param declaration Candidate declaration.
 * @returns Metadata or undefined for unknown/custom properties.
 */
export function metaOf(
  declaration: RcssDeclaration,
): ReturnType<typeof getPropertyMeta> {
  if (declaration.name.startsWith('--')) {
    return undefined;
  }
  return getPropertyMeta(declaration.name);
}
