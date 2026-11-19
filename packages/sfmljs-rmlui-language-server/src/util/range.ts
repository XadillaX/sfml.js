'use strict';

/**
 * Offset-based range primitives shared by the pure language parsers.
 * Keeping these free of the vscode API lets the parsing logic run under
 * plain Node.js in unit tests.
 */

/** Half-open character offset range. */
export interface RawRange {
  /** Inclusive start offset. */
  start: number;
  /** Exclusive end offset. */
  end: number;
}

/** Zero-based line and character position. */
export interface RawPosition {
  /** Zero-based line index. */
  line: number;
  /** Zero-based character index on the line. */
  character: number;
}

/**
 * Converts a zero-based offset to a line/character position.
 *
 * @param text Full document text.
 * @param offset Character offset.
 * @returns Position clamped to the document length.
 */
export function positionAt(text: string, offset: number): RawPosition {
  const clamped = Math.max(0, Math.min(offset, text.length));
  let line = 0;
  let lineStart = 0;
  for (let i = 0; i < clamped; i += 1) {
    if (text[i] === '\n') {
      line += 1;
      lineStart = i + 1;
    }
  }
  return { line, character: clamped - lineStart };
}

/**
 * Converts a line/character position to an offset.
 *
 * @param text Full document text.
 * @param position Line/character position.
 * @returns Character offset.
 */
export function offsetAt(text: string, position: RawPosition): number {
  let line = 0;
  let i = 0;
  while (i < text.length && line < position.line) {
    if (text[i] === '\n') {
      line += 1;
    }
    i += 1;
  }
  if (line < position.line) {
    return text.length;
  }
  return Math.min(i + position.character, text.length);
}

/**
 * Returns the identifier-like word immediately before an offset.
 *
 * @param text Document text.
 * @param offset Caret offset.
 * @returns Word characters and the range they occupy.
 */
export function prefixAt(
  text: string,
  offset: number,
): { prefix: string; range: RawRange } {
  let start = offset;
  const wordPattern = /[\w-]/;
  while (start > 0 && wordPattern.test(text[start - 1])) {
    start -= 1;
  }
  return { prefix: text.slice(start, offset), range: { start, end: offset } };
}

/**
 * Checks whether an offset lies inside a half-open range.
 *
 * @param range Candidate range.
 * @param offset Offset to test.
 * @returns True when start <= offset < end.
 */
export function contains(range: RawRange, offset: number): boolean {
  return offset >= range.start && offset < range.end;
}
