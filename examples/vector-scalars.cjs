'use strict';

const { existsSync } = require('node:fs');
const { join } = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const {
  vector2Native, vector2Storage,
} = require('../dist/internal/value-storage');

async function main() {
  const font = new sf.Font();
  const systemFont = '/System/Library/Fonts/Supplemental/Arial Unicode.ttf';
  const fontPath = existsSync(systemFont) ? systemFont
    : join(__dirname, '../test/fixtures/fonts/DejaVuSansMono.ttf');
  if (!await font.openFromFile(fontPath)) {
    throw new Error('Cannot load the demo font');
  }

  const window = new sf.RenderWindow(new sf.Vector2u(1120, 760),
    'sfml.js | Vector scalar types', {
      style: sf.Style.Titlebar + sf.Style.Close,
    });
  window.setPosition(new sf.Vector2i(80, 60));
  window.setKeyRepeatEnabled(false);

  const background = new sf.Color(13, 18, 27);
  const panel = new sf.Color(23, 31, 43);
  const accent = new sf.Color(72, 222, 174);
  const cyan = new sf.Color(73, 190, 235);
  const yellow = new sf.Color(242, 193, 78);
  const muted = new sf.Color(158, 179, 199);
  const texts = [];
  const shapes = [];

  function text(content, x, y, size = 18, color = sf.Color.White) {
    const value = new sf.Text({ font, string: content, characterSize: size });
    value.setPosition(new sf.Vector2f(x, y));
    value.setFillColor(color);
    value.setLineSpacing(1.12);
    texts.push(value);
    return value;
  }

  function box(x, y, width, height, color = panel) {
    const value = new sf.RectangleShape(new sf.Vector2f(width, height));
    value.setPosition(new sf.Vector2f(x, y));
    value.setFillColor(color);
    shapes.push(value);
    return value;
  }

  function update(value, content) {
    if (value.getString() !== content) value.setString(content);
  }

  text('VECTOR SCALAR TYPES', 32, 22, 30);
  text('f64 / i8 / u8 / i16 / u16 / i64 / u64',
    34, 63, 18, muted);
  box(28, 104, 516, 224);
  box(564, 104, 528, 224);
  box(28, 348, 1064, 334);

  text('FLOAT64 PRECISION', 48, 124, 22, accent);
  const f64 = new sf.Vector2('f64', 16777217, 1 / 3);
  const f32 = new sf.Vector2f(f64);
  text('source', 48, 174, 16, muted);
  text(`[${f64.x}, ${f64.y}]`, 142, 170, 19);
  text('to f32', 48, 216, 16, muted);
  text(`[${f32.x}, ${f32.y}]`, 142, 212, 19, yellow);
  text(`delta x: ${f64.x - f32.x}`, 48, 260, 18, cyan);
  text('Float64Array keeps the exact 16777217 value.',
    48, 294, 14, muted);

  text('INT64 EXACT ARITHMETIC', 584, 124, 22, accent);
  const exact = 9007199254740993n;
  const i64 = new sf.Vector2('i64', exact, -exact);
  const doubled = sf.add(i64, i64);
  text('input', 584, 174, 16, muted);
  text(`${i64.x}`, 670, 170, 19);
  text('input x 2', 584, 216, 16, muted);
  text(`${doubled.x}`, 670, 212, 19, yellow);
  text(`typeof component: ${typeof i64.x}`, 584, 260, 18, cyan);
  text('BigInt64Array never passes through Number.',
    584, 294, 14, muted);

  text('LIVE SHARED STORAGE', 48, 368, 22, accent);
  text('TYPE', 48, 414, 14, muted);
  text('TYPED ARRAY', 136, 414, 14, muted);
  text('CURRENT VECTOR', 350, 414, 14, muted);
  text('DOT SELF', 650, 414, 14, muted);
  text('NATIVE', 900, 414, 14, muted);

  const rows = [
    [ 'f64', Float64Array, 1.25, 2.5 ],
    [ 'i8', Int8Array, 120, -7 ],
    [ 'u8', Uint8Array, 250, 7 ],
    [ 'i16', Int16Array, 32000, -99 ],
    [ 'u16', Uint16Array, 65000, 99 ],
    [ 'i64', BigInt64Array, 9007199254740993n, -3n ],
    [ 'u64', BigUint64Array, 18446744073709551615n, 3n ],
  ].map(([ type, ArrayType, x, y ], index) => {
    const vector = new sf.Vector2(type, x, y);
    const storage = vector[vector2Storage];
    const handle = vector[vector2Native];
    const nativeValues = native.readVector2(handle);
    const yPosition = 449 + index * 31;
    text(type, 48, yPosition, 16, type === 'f64' ? accent : cyan);
    text(ArrayType.name, 136, yPosition, 16);
    const values = text('', 350, yPosition, 16);
    const dot = text('', 650, yPosition, 16, yellow);
    text(nativeValues[0] === vector.x && nativeValues[1] === vector.y
      ? 'MATCH' : 'MISMATCH', 900, yPosition, 16, accent);
    return { type, vector, storage, values, dot };
  });

  const status = text('', 32, 708, 15, muted);
  const clock = new sf.Clock();
  let frames = 0;
  window.requestFocus();
  try {
    while (window.isOpen()) {
      for (let event; (event = window.pollEvent());) {
        const key = event.getIf('KeyPressed');
        if (event.is('Closed') || key?.code === sf.Keyboard.Key.Escape) {
          window.close();
          break;
        }
      }
      if (!window.isOpen()) break;
      const phase = Math.floor(clock.getElapsedTime().asSeconds() * 2);
      for (const row of rows) {
        const delta = row.type === 'i64' || row.type === 'u64'
          ? BigInt(phase % 5) : phase % 5;
        row.storage[1] = row.type.startsWith('u')
          ? delta : -delta;
        update(row.values, `[${row.vector.x}, ${row.vector.y}]`);
        update(row.dot, String(row.vector.dot(row.vector)));
      }
      update(status, `LIVE ${frames} frames   /   JS writes TypedArray, ` +
        'Native reads the same BackingStore   /   Esc closes');
      window.clear(background);
      for (const shape of shapes) window.draw(shape);
      for (const value of texts) window.draw(value);
      window.display();
      frames++;
      await delay(16);
    }
  } finally {
    window.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
