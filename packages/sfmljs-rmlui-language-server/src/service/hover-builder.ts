'use strict';

/**
 * Pure hover content builder.
 *
 * Returns markdown text and an offset range so the LSP transport layer can
 * create protocol Hover objects without depending on any editor API.
 */

import {
  AT_RULES,
  getPropertyDocUrl,
  getPropertyMeta,
  getPseudoMeta,
  PSEUDO_CLASSES,
  SELECTORS_DOC_URL,
} from '../meta/rcss-meta';
import {
  getGlobalAttributeMeta,
  getTagDocUrl,
  getTagMeta,
} from '../meta/rml-meta';
import {
  declarationAt,
  parseRcss,
} from '../util/rcss-parser';
import { parseRml } from '../util/rml-parser';
import { contains, prefixAt, type RawRange } from '../util/range';

/** Hover result carrying markdown content and a source range. */
export interface PureHover {
  /** Markdown string shown in the hover widget. */
  markdown: string;
  /** Offset range the hover applies to. */
  range: RawRange;
}

/**
 * Builds hover content for an RCSS document position.
 *
 * @param text Document text.
 * @param offset Caret offset.
 * @returns Hover content, or undefined when nothing matches.
 */
export function hoverRcss(text: string, offset: number): PureHover | undefined {
  const parsed = parseRcss(text);
  const declaration = declarationAt(parsed, offset);
  if (declaration) {
    const meta = getPropertyMeta(declaration.name);
    if (!meta) {
      return undefined;
    }
    const lines = [
      '```rcss',
      `${meta.name}: ${meta.values}`,
      '```',
      '',
      meta.description,
      '',
      `Initial: \`${meta.initial}\` · Inherited: \`${meta.inherited}\``,
      '',
      `[RmlUi manual](${getPropertyDocUrl(meta)})`,
    ];
    return { markdown: lines.join('\n'), range: declaration.nameRange };
  }

  const pseudo = findPseudo(text, offset);
  if (pseudo) {
    const meta = getPseudoMeta(pseudo.name);
    if (!meta) {
      return undefined;
    }
    const markdown = [
      '```rcss',
      `:${meta.name}`,
      '```',
      '',
      meta.description,
      '',
      `[RCSS selectors](${SELECTORS_DOC_URL})`,
    ].join('\n');
    return { markdown, range: pseudo.range };
  }

  const atRule = findAtRule(text, offset);
  if (atRule) {
    const markdown = [
      '```rcss',
      `@${atRule.rule.name}`,
      '```',
      '',
      atRule.rule.description,
    ].join('\n');
    return { markdown, range: atRule.range };
  }
  return undefined;
}

/**
 * Builds hover content for an RML document position.
 *
 * @param text Document text.
 * @param offset Caret offset.
 * @returns Hover content, or undefined when nothing matches.
 */
export function hoverRml(text: string, offset: number): PureHover | undefined {
  const parsed = parseRml(text);
  for (const element of parsed.elements) {
    if (contains(element.nameRange, offset)) {
      const meta = getTagMeta(element.tag);
      if (!meta) {
        continue;
      }
      const markdown = [
        '```rml',
        `<${meta.name}>`,
        '```',
        '',
        meta.description,
        '',
        `[RmlUi manual](${getTagDocUrl(meta)})`,
      ].join('\n');
      return { markdown, range: element.nameRange };
    }
    for (const attribute of element.attributes) {
      if (contains(attribute.nameRange, offset)) {
        const meta = getGlobalAttributeMeta(attribute.name);
        if (!meta) {
          continue;
        }
        const markdown = [
          '```rml',
          meta.name,
          '```',
          '',
          meta.description,
        ].join('\n');
        return { markdown, range: attribute.nameRange };
      }
    }
  }
  return undefined;
}

/**
 * Finds the pseudo-class reference at an offset.
 *
 * @param text Document text.
 * @param offset Caret offset.
 * @returns Pseudo-class name and range, or undefined.
 */
function findPseudo(
  text: string,
  offset: number,
): { name: string; range: RawRange } | undefined {
  for (const reference of parseRcss(text).pseudoReferences) {
    if (contains(reference.range, offset)) {
      return reference;
    }
  }
  const word = prefixAt(text, offset);
  if (PSEUDO_CLASSES.some(item => item.name === word.prefix)) {
    return { name: word.prefix, range: word.range };
  }
  return undefined;
}

/**
 * Finds the at-rule token on the line enclosing an offset.
 *
 * @param text Document text.
 * @param offset Caret offset.
 * @returns At-rule metadata and range, or undefined.
 */
function findAtRule(
  text: string,
  offset: number,
): { rule: (typeof AT_RULES)[number]; range: RawRange } | undefined {
  const lineStart = text.lastIndexOf('\n', offset - 1) + 1;
  const match = /@([\w-]+)/.exec(text.slice(lineStart, offset + 1));
  if (!match) {
    return undefined;
  }
  const rule = AT_RULES.find(item => item.name === match[1].toLowerCase());
  if (!rule) {
    return undefined;
  }
  return {
    rule,
    range: {
      start: lineStart + (match.index ?? 0),
      end: lineStart + (match.index ?? 0) + match[0].length,
    },
  };
}
