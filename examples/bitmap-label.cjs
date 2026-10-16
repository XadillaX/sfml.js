'use strict';

const { Texture, Sprite, Vector2u, Vector2f, Color } = require('..');

// A tiny diagnostic font, uploaded through the same public Texture API.
const glyphs = {
  A: [ 14, 17, 17, 31, 17, 17, 17 ],
  B: [ 30, 17, 17, 30, 17, 17, 30 ],
  C: [ 14, 17, 16, 16, 16, 17, 14 ],
  D: [ 30, 17, 17, 17, 17, 17, 30 ],
  E: [ 31, 16, 16, 30, 16, 16, 31 ],
  F: [ 31, 16, 16, 30, 16, 16, 16 ],
  G: [ 14, 17, 16, 23, 17, 17, 15 ],
  H: [ 17, 17, 17, 31, 17, 17, 17 ],
  I: [ 14, 4, 4, 4, 4, 4, 14 ],
  J: [ 7, 2, 2, 2, 2, 18, 12 ],
  K: [ 17, 18, 20, 24, 20, 18, 17 ],
  L: [ 16, 16, 16, 16, 16, 16, 31 ],
  M: [ 17, 27, 21, 21, 17, 17, 17 ],
  N: [ 17, 25, 21, 19, 17, 17, 17 ],
  O: [ 14, 17, 17, 17, 17, 17, 14 ],
  P: [ 30, 17, 17, 30, 16, 16, 16 ],
  Q: [ 14, 17, 17, 17, 21, 18, 13 ],
  R: [ 30, 17, 17, 30, 20, 18, 17 ],
  S: [ 15, 16, 16, 14, 1, 1, 30 ],
  T: [ 31, 4, 4, 4, 4, 4, 4 ],
  U: [ 17, 17, 17, 17, 17, 17, 14 ],
  V: [ 17, 17, 17, 17, 17, 10, 4 ],
  W: [ 17, 17, 17, 21, 21, 21, 10 ],
  X: [ 17, 17, 10, 4, 10, 17, 17 ],
  Y: [ 17, 17, 10, 4, 4, 4, 4 ],
  Z: [ 31, 1, 2, 4, 8, 16, 31 ],
  0: [ 14, 17, 19, 21, 25, 17, 14 ],
  1: [ 4, 12, 4, 4, 4, 4, 14 ],
  2: [ 14, 17, 1, 2, 4, 8, 31 ],
  3: [ 30, 1, 1, 14, 1, 1, 30 ],
  4: [ 2, 6, 10, 18, 31, 2, 2 ],
  5: [ 31, 16, 16, 30, 1, 1, 30 ],
  6: [ 14, 16, 16, 30, 17, 17, 14 ],
  7: [ 31, 1, 2, 4, 8, 8, 8 ],
  8: [ 14, 17, 17, 14, 17, 17, 14 ],
  9: [ 14, 17, 17, 15, 1, 1, 14 ],
  '/': [ 1, 2, 2, 4, 8, 8, 16 ],
  '-': [ 0, 0, 0, 31, 0, 0, 0 ],
  ':': [ 0, 4, 4, 0, 4, 4, 0 ],
  '.': [ 0, 0, 0, 0, 0, 4, 4 ],
  '+': [ 0, 4, 4, 31, 4, 4, 0 ],
  '?': [ 14, 17, 1, 2, 4, 0, 4 ],
  ' ': [ 0, 0, 0, 0, 0, 0, 0 ],
};

function label(text, x, y, scale = 2, color = Color.White) {
  const width = text.length * 6 * scale;
  const height = 7 * scale;
  const texture = new Texture(new Vector2u(width, height));
  const pixels = new Uint8Array(width * height * 4);
  for (let index = 0; index < text.length; index++) {
    const glyph = glyphs[text[index]];
    if (!glyph) throw new TypeError(`Missing diagnostic glyph: ${text[index]}`);
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (Math.floor(glyph[row] / 2 ** (4 - col)) % 2 === 0) continue;
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            const position = ((row * scale + dy) * width +
              (index * 6 + col) * scale + dx) * 4;
            pixels.set([ color.r, color.g, color.b, color.a ], position);
          }
        }
      }
    }
  }
  texture.update(pixels);
  const sprite = new Sprite(texture);
  sprite.setPosition(new Vector2f(x, y));
  return sprite;
}

module.exports = { label };
