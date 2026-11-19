'use strict';

/**
 * RCSS color parsing and formatting.
 *
 * Supports the color grammars listed in the official RCSS syntax manual:
 * hexadecimal (#RGB/#RGBA/#RRGGBB/#RRGGBBAA), rgb/rgba, hsl/hsla and the
 * documented named color set. lab/lch families are recognized by the
 * TextMate grammar but are not converted here.
 */

import { NAMED_COLORS } from '../meta/rcss-meta';
import type { RawRange } from './range';

/** RGBA channels normalized to 0..1. */
export interface RgbaColor {
  /** Red channel. */
  r: number;
  /** Green channel. */
  g: number;
  /** Blue channel. */
  b: number;
  /** Alpha channel. */
  a: number;
}

/** A color literal found while scanning an RCSS document. */
export interface RcssColor {
  /** Source range of the literal. */
  range: RawRange;
  /** Parsed RGBA value. */
  color: RgbaColor;
}

const HEX_PATTERN =
  /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b/g;
const FUNC_PATTERN =
  /\b(?:rgba?|hsla?)\(([^()]*)\)/gi;
const NAMED_PATTERN = new RegExp(
  `\\b(?:${Object.keys(NAMED_COLORS).join('|')})\\b`,
  'gi',
);

/**
 * Clamps a numeric channel to the integer range 0..255.
 *
 * @param value Candidate channel value.
 * @returns Clamped integer channel.
 */
function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

/**
 * Clamps an alpha value to the range 0..1.
 *
 * @param value Candidate alpha value.
 * @returns Clamped alpha value.
 */
function clampAlpha(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * Expands an RCSS hex literal into RGBA channels.
 *
 * @param value Hex literal including the leading hash.
 * @returns Red, green, blue and alpha channels.
 */
function expandHex(value: string): [number, number, number, number] {
  let hex = value.slice(1);
  if (hex.length === 3 || hex.length === 4) {
    hex = hex.split('').map(char => char + char).join('');
  }
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
  return [ r, g, b, a ];
}

/**
 * Parses an rgb/rgba/hsl/hsla function call into RGBA channels.
 *
 * @param raw Full function literal including parentheses.
 * @returns Parsed color, or undefined when the syntax is invalid.
 */
function parseFunctionalColor(raw: string): RgbaColor | undefined {
  const match = /^(rgba?|hsla?)\(([^()]*)\)$/i.exec(raw);
  if (!match) {
    return undefined;
  }
  const kind = match[1].toLowerCase();
  const parts = match[2].split(/[\s,/]+/).filter(part => part.length > 0);
  if (kind.startsWith('hsl')) {
    const hue = Number.parseFloat(parts[0]);
    const sat = parseFloat(parts[1]) / 100;
    const light = parseFloat(parts[2]) / 100;
    const rgb = hslToRgb(hue, sat, light);
    const alpha = parts[3] === undefined
      ? 1
      : parseAlpha(parts[3]);
    return { ...rgb, a: clampAlpha(alpha) };
  }
  const r = parseByte(parts[0]);
  const g = parseByte(parts[1]);
  const b = parseByte(parts[2]);
  const alpha = parts[3] === undefined ? 1 : parseAlpha(parts[3]);
  if ([ r, g, b ].some(value => Number.isNaN(value))) {
    return undefined;
  }
  return {
    r: clampChannel(r),
    g: clampChannel(g),
    b: clampChannel(b),
    a: clampAlpha(alpha),
  };
}

/**
 * Parses an 8-bit channel token, accepting percentage notation.
 *
 * @param token Number or percentage token.
 * @returns Numeric channel value.
 */
function parseByte(token: string): number {
  if (token.endsWith('%')) {
    return Number.parseFloat(token) * 2.55;
  }
  return Number.parseFloat(token);
}

/**
 * Parses an alpha token, accepting percentage notation.
 *
 * @param token Number or percentage token.
 * @returns Numeric alpha value between 0 and 1.
 */
function parseAlpha(token: string): number {
  if (token.endsWith('%')) {
    return Number.parseFloat(token) / 100;
  }
  return Number.parseFloat(token);
}

/**
 * Converts HSL components to an RGBA color with full opacity.
 *
 * @param h Hue in degrees.
 * @param s Saturation between 0 and 1.
 * @param l Lightness between 0 and 1.
 * @returns Equivalent RGBA color.
 */
function hslToRgb(h: number, s: number, l: number): RgbaColor {
  const hue = ((h % 360) + 360) % 360 / 360;
  if (s === 0) {
    const channel = clampChannel(l * 255);
    return { r: channel, g: channel, b: channel, a: 1 };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = hueToChannel(p, q, hue + 1 / 3);
  const g = hueToChannel(p, q, hue);
  const b = hueToChannel(p, q, hue - 1 / 3);
  return {
    r: clampChannel(r * 255),
    g: clampChannel(g * 255),
    b: clampChannel(b * 255),
    a: 1,
  };
}

/**
 * Computes one RGB channel from HSL conversion intermediates.
 *
 * @param p HSL conversion intermediate p.
 * @param q HSL conversion intermediate q.
 * @param t Normalized hue position for the channel.
 * @returns Channel value between 0 and 1.
 */
function hueToChannel(p: number, q: number, t: number): number {
  let value = t;
  if (value < 0) {
    value += 1;
  }
  if (value > 1) {
    value -= 1;
  }
  if (value < 1 / 6) {
    return p + (q - p) * 6 * value;
  }
  if (value < 1 / 2) {
    return q;
  }
  if (value < 2 / 3) {
    return p + (q - p) * (2 / 3 - value) * 6;
  }
  return p;
}

/**
 * Scans RCSS text for every convertible color literal.
 *
 * @param text Document or declaration text.
 * @returns Color literals with source ranges.
 */
export function findColors(text: string): RcssColor[] {
  const results: RcssColor[] = [];
  const push = (range: RawRange, color: RgbaColor | undefined): void => {
    if (color) {
      results.push({ range, color });
    }
  };

  for (const match of text.matchAll(HEX_PATTERN)) {
    const start = match.index ?? 0;
    const [ r, g, b, a ] = expandHex(match[0]);
    push({ start, end: start + match[0].length }, { r, g, b, a });
  }

  for (const match of text.matchAll(FUNC_PATTERN)) {
    const start = match.index ?? 0;
    push(
      { start, end: start + match[0].length },
      parseFunctionalColor(match[0]),
    );
  }

  for (const match of text.matchAll(NAMED_PATTERN)) {
    const start = match.index ?? 0;
    const hex = NAMED_COLORS[match[0].toLowerCase()];
    const [ r, g, b, a ] = expandHex(hex);
    results.push({
      range: { start, end: start + match[0].length },
      color: { r, g, b, a },
    });
  }

  return results.sort((left, right) => left.range.start - right.range.start);
}

/**
 * Formats one channel as a two-digit hexadecimal string.
 *
 * @param value Numeric channel value.
 * @returns Two-digit lowercase hex string.
 */
function toHex(value: number): string {
  return clampChannel(value).toString(16).padStart(2, '0');
}

/**
 * Formats a color as an 8-digit hex literal.
 *
 * @param color RGBA color.
 * @returns #RRGGBBAA string.
 */
export function formatHex(color: RgbaColor): string {
  const alpha = Math.round(clampAlpha(color.a) * 255);
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}` +
    toHex(alpha);
}

/**
 * Formats a color as an rgba() literal.
 *
 * @param color RGBA color.
 * @returns rgba(r, g, b, a) string.
 */
export function formatRgba(color: RgbaColor): string {
  return `rgba(${clampChannel(color.r)}, ${clampChannel(color.g)}, ` +
    `${clampChannel(color.b)}, ${clampAlpha(color.a).toFixed(2)})`;
}
