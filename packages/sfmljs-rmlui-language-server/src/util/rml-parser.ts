'use strict';

/**
 * Hand-written RML parser for tag/attribute intelligence.
 *
 * RML is a strict XML-like HTML subset, so a small scanner with a tag stack
 * provides enough structure to validate nesting, index ids/classes and
 * locate completion contexts. Comments, CDATA sections and inline style
 * blocks are skipped during scanning.
 */

import { prefixAt, type RawRange } from './range';
import type { PureDiagnostic } from './rcss-parser';

/** Attributes parsed from one RML open tag. */
export interface RmlAttribute {
  /** Attribute name. */
  name: string;
  /** Source range of the name. */
  nameRange: RawRange;
  /** Unquoted attribute value, when present. */
  value?: string;
  /** Source range of the value excluding quotes. */
  valueRange?: RawRange;
}

/** One opening tag encountered in the document. */
export interface RmlElement {
  /** Tag name in lower case. */
  tag: string;
  /** Range covering the whole open tag. */
  openTagRange: RawRange;
  /** Range of the tag name token. */
  nameRange: RawRange;
  /** Attributes declared on the tag. */
  attributes: RmlAttribute[];
  /** True when the tag self-closes or is a known void element. */
  selfClosing: boolean;
}

/** External resource reference found on a link, img or script tag. */
export interface RmlLink {
  /** Raw resource path. */
  target: string;
  /** Range of the value excluding quotes. */
  range: RawRange;
}

/** Parse result for an RML document. */
export interface RmlParseResult {
  /** Elements in source order. */
  elements: RmlElement[];
  /** Parser diagnostics. */
  diagnostics: PureDiagnostic[];
  /** All id attribute values in source order. */
  ids: string[];
  /** All class tokens in source order. */
  classes: string[];
  /** External resource references. */
  links: RmlLink[];
}

/** Completion context at a caret position. */
export type RmlCompletionContext =
  | { kind: 'none' }
  | {
    kind: 'tag';
    prefix: string;
    range: RawRange;
    closing: boolean;
  }
  | {
    kind: 'attribute';
    tag: string | null;
    prefix: string;
    range: RawRange;
  }
  | {
    kind: 'attributeValue';
    tag: string | null;
    attribute: string;
    prefix: string;
    range: RawRange;
  };

const VOID_TAGS = new Set([
  'link', 'img', 'input', 'br', 'hr', 'col', 'progress', 'progressbar',
  'lottie',
]);
const TAG_START = /[a-zA-Z]/;
const ATTRIBUTE_NAME = /[\w:-]+/y;
const TAG_NAME = /[\w-]+/y;

interface StackFrame {
  tag: string;
  nameRange: RawRange;
  openTagStart: number;
}

/**
 * Parses a complete RML document.
 *
 * @param text Document text.
 * @returns Elements, references and diagnostics.
 */
export function parseRml(text: string): RmlParseResult {
  const elements: RmlElement[] = [];
  const diagnostics: PureDiagnostic[] = [];
  const ids: string[] = [];
  const classes: string[] = [];
  const links: RmlLink[] = [];
  const stack: StackFrame[] = [];
  let i = 0;

  while (i < text.length) {
    if (text.startsWith('<!--', i)) {
      i = skipTo(text, i, '-->');
      continue;
    }
    if (text.startsWith('<![CDATA[', i)) {
      i = skipTo(text, i, ']]>');
      continue;
    }
    if (matchStyleOpen(text, i)) {
      i = skipStyleBlock(text, i);
      continue;
    }
    if (text[i] === '<' && TAG_START.test(text[i + 1] ?? '')) {
      i = parseOpenTag(text, i, {
        elements, diagnostics, ids, classes, links, stack,
      });
      continue;
    }
    if (text.startsWith('</', i) && TAG_START.test(text[i + 2] ?? '')) {
      i = parseCloseTag(text, i, diagnostics, stack);
      continue;
    }
    i += 1;
  }

  for (const frame of stack) {
    diagnostics.push({
      range: frame.nameRange,
      message: `Element <${frame.tag}> is never closed.`,
      severity: 'error',
      code: 'rml-unclosed-tag',
    });
  }

  return { elements, diagnostics, ids, classes, links };
}

interface OpenTagSink {
  elements: RmlElement[];
  diagnostics: PureDiagnostic[];
  ids: string[];
  classes: string[];
  links: RmlLink[];
  stack: StackFrame[];
}

/**
 * Parses one opening tag and records its element, attributes and stack frame.
 *
 * @param text Document text.
 * @param start Offset of the opening angle bracket.
 * @param sink Sink receiving elements, symbols and diagnostics.
 * @returns Offset immediately after the tag head.
 */
function parseOpenTag(text: string, start: number, sink: OpenTagSink): number {
  TAG_NAME.lastIndex = start + 1;
  const nameMatch = TAG_NAME.exec(text);
  if (!nameMatch) {
    return start + 1;
  }
  const tag = nameMatch[0].toLowerCase();
  const nameRange = {
    start: start + 1,
    end: start + 1 + nameMatch[0].length,
  };
  const head = scanTagHead(text, nameRange.end);
  const selfClosing = head.selfClosing || VOID_TAGS.has(tag);
  const element: RmlElement = {
    tag,
    openTagRange: { start, end: head.end },
    nameRange,
    attributes: head.attributes,
    selfClosing,
  };
  sink.elements.push(element);
  for (const attribute of head.attributes) {
    collectAttribute(attribute, sink);
  }
  if (!selfClosing) {
    sink.stack.push({ tag, nameRange, openTagStart: start });
  }
  return head.end;
}

interface TagHeadScan {
  attributes: RmlAttribute[];
  selfClosing: boolean;
  end: number;
}

/**
 * Scans attributes and the self-closing marker inside a tag head.
 *
 * @param text Document text.
 * @param from Offset immediately after the tag name.
 * @returns Parsed attributes, self-closing flag and head end offset.
 */
function scanTagHead(text: string, from: number): TagHeadScan {
  const attributes: RmlAttribute[] = [];
  let i = from;
  let selfClosing = false;
  while (i < text.length && text[i] !== '>') {
    if (text[i] === '/') {
      selfClosing = true;
      i += 1;
      continue;
    }
    if (/\s/.test(text[i])) {
      i += 1;
      continue;
    }
    ATTRIBUTE_NAME.lastIndex = i;
    const match = ATTRIBUTE_NAME.exec(text);
    if (!match) {
      i += 1;
      continue;
    }
    const name = match[0];
    const nameRange = { start: i, end: i + name.length };
    i += name.length;
    while (i < text.length && /\s/.test(text[i])) {
      i += 1;
    }
    const attribute: RmlAttribute = { name, nameRange };
    if (text[i] === '=') {
      i += 1;
      while (i < text.length && /\s/.test(text[i])) {
        i += 1;
      }
      const quote = text[i];
      if (quote === '"' || quote === "'") {
        const valueStart = i + 1;
        const valueEnd = text.indexOf(quote, valueStart);
        const end = valueEnd === -1 ? text.length : valueEnd;
        attribute.value = text.slice(valueStart, end);
        attribute.valueRange = { start: valueStart, end };
        i = valueEnd === -1 ? text.length : valueEnd + 1;
      }
    }
    attributes.push(attribute);
  }
  const end = text[i] === '>' ? i + 1 : i;
  return { attributes, selfClosing, end };
}

/**
 * Reads attributes inside a bounded tag head region.
 *
 * @param text Document text.
 * @param from Scan start offset.
 * @param until Exclusive end offset of the tag head.
 * @returns Attributes declared in the region.
 */
function readAttributes(
  text: string,
  from: number,
  until: number,
): RmlAttribute[] {
  const head = scanTagHead(text.slice(0, until), from);
  return head.attributes;
}

/**
 * Indexes ids, classes and resource links from one attribute.
 *
 * @param attribute Parsed attribute.
 * @param sink Sink receiving ids, classes and links.
 */
function collectAttribute(
  attribute: RmlAttribute,
  sink: OpenTagSink,
): void {
  if (attribute.name === 'id' && attribute.value !== undefined) {
    sink.ids.push(attribute.value);
  }
  if (attribute.name === 'class' && attribute.value !== undefined) {
    for (const token of attribute.value.split(/\s+/).filter(Boolean)) {
      sink.classes.push(token);
    }
  }
  if (
    (attribute.name === 'href' || attribute.name === 'src') &&
    attribute.valueRange &&
    attribute.value !== undefined
  ) {
    sink.links.push({
      target: attribute.value,
      range: attribute.valueRange,
    });
  }
}

/**
 * Parses a closing tag, validating it against the open-tag stack.
 *
 * @param text Document text.
 * @param start Offset of the "</" sequence.
 * @param diagnostics Sink receiving mismatch diagnostics.
 * @param stack Open-tag stack popped during matching.
 * @returns Offset immediately after the closing tag.
 */
function parseCloseTag(
  text: string,
  start: number,
  diagnostics: PureDiagnostic[],
  stack: StackFrame[],
): number {
  TAG_NAME.lastIndex = start + 2;
  const match = TAG_NAME.exec(text);
  const endOffset = text.indexOf('>', start);
  const end = endOffset === -1 ? text.length : endOffset + 1;
  if (!match) {
    return end;
  }
  const tag = match[0].toLowerCase();
  const nameRange = {
    start: start + 2,
    end: start + 2 + match[0].length,
  };
  const frame = stack.pop();
  if (!frame || frame.tag !== tag) {
    diagnostics.push({
      range: nameRange,
      message: frame
        ? `Mismatched closing tag </${tag}>; expected </${frame.tag}>.`
        : `Closing tag </${tag}> has no matching open tag.`,
      severity: 'error',
      code: 'rml-mismatched-tag',
    });
    if (frame) {
      stack.push(frame);
    }
  }
  return end;
}

/**
 * Advances from an offset to the end of a delimiter token.
 *
 * @param text Document text.
 * @param from Search start offset.
 * @param token Delimiter token to find.
 * @returns Offset after the token, or the document length when absent.
 */
function skipTo(text: string, from: number, token: string): number {
  const end = text.indexOf(token, from);
  return end === -1 ? text.length : end + token.length;
}

/**
 * Checks whether an offset starts an opening <style> tag.
 *
 * @param text Document text.
 * @param offset Candidate offset.
 * @returns True for style element openings.
 */
function matchStyleOpen(text: string, offset: number): boolean {
  if (text[offset] !== '<') {
    return false;
  }
  const rest = text.slice(offset, offset + 7).toLowerCase();
  return rest === '<style>' || rest.startsWith('<style ');
}

/**
 * Skips the full content of an inline style element.
 *
 * @param text Document text.
 * @param from Offset of the style opening tag.
 * @returns Offset after the matching closing tag.
 */
function skipStyleBlock(text: string, from: number): number {
  const close = text.toLowerCase().indexOf('</style>', from);
  return close === -1 ? text.length : close + '</style>'.length;
}

/**
 * Determines the completion context at a caret offset.
 *
 * @param text Document text.
 * @param offset Caret offset.
 * @returns Context describing what should be suggested.
 */
export function getRmlCompletionContext(
  text: string,
  offset: number,
): RmlCompletionContext {
  const head = findTagHead(text, offset);
  if (!head) {
    return { kind: 'none' };
  }
  const word = prefixAt(text, offset);

  const afterName = head.nameEnd;
  if (offset <= afterName) {
    return {
      kind: 'tag',
      prefix: text.slice(head.tagStart, offset),
      range: { start: head.tagStart, end: offset },
      closing: head.closing,
    };
  }

  for (const attribute of readAttributes(text, afterName, head.end)) {
    if (
      attribute.valueRange &&
      offset >= attribute.valueRange.start &&
      offset <= attribute.valueRange.end
    ) {
      return {
        kind: 'attributeValue',
        tag: head.tag,
        attribute: attribute.name,
        prefix: text.slice(attribute.valueRange.start, offset),
        range: { start: attribute.valueRange.start, end: offset },
      };
    }
  }

  return {
    kind: 'attribute',
    tag: head.tag,
    ...word,
  };
}

interface TagHead {
  tag: string | null;
  tagStart: number;
  nameEnd: number;
  end: number;
  closing: boolean;
}

/**
 * Locates the tag head enclosing a caret offset.
 *
 * @param text Document text.
 * @param offset Caret offset.
 * @returns Tag head information, or undefined outside any tag.
 */
function findTagHead(text: string, offset: number): TagHead | undefined {
  let open = -1;
  for (let i = offset - 1; i >= 0; i -= 1) {
    if (text[i] === '>') {
      return undefined;
    }
    if (text[i] === '<') {
      open = i;
      break;
    }
  }
  if (open === -1) {
    return undefined;
  }
  const closing = text.startsWith('</', open);
  const nameStart = open + (closing ? 2 : 1);
  TAG_NAME.lastIndex = nameStart;
  const match = TAG_NAME.exec(text);
  if (!match) {
    return {
      tag: null,
      tagStart: nameStart,
      nameEnd: nameStart,
      end: offset,
      closing,
    };
  }
  return {
    tag: match[0].toLowerCase(),
    tagStart: nameStart,
    nameEnd: nameStart + match[0].length,
    end: offset,
    closing,
  };
}
