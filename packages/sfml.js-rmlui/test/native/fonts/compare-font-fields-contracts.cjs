'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const rmlui = require('../../../dist');
const sfml = require('sfml.js');

const references = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const bytes = fs.readFileSync(path.resolve(__dirname,
  '../../../third_party/rmlui/Samples/assets/LatoLatin-Regular.ttf'));
const fields = [
  'ascent', 'descent', 'lineSpacing', 'xHeight',
  'underlinePosition', 'underlineThickness',
];
const window = new sfml.RenderWindow(
  new sfml.VideoMode(new sfml.Vector2u(80, 60)), 'Native font fields');

try {
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  const engine = rmlui.getFontEngineInterface();
  assert.ok(engine.loadFontFace(bytes, 'field-reference',
    rmlui.FontStyle.Normal, rmlui.FontWeight.Normal, false, 0));

  for (const reference of references) {
    const face = engine.getFontFaceHandle('field-reference',
      rmlui.FontStyle.Normal, rmlui.FontWeight.Normal, reference.size);
    const metrics = engine.getFontMetrics(face);
    assert.equal(metrics.size, reference.size);
    assert.equal(metrics.hasEllipsis, reference.hasEllipsis);
    assert.deepEqual([ ...metrics.values ], reference.values);
    assert.deepEqual(fields.map(field => metrics[field]), reference.values);
    console.log(`PASS native-managed-font-metrics-${reference.size}`);

    const shaping = new rmlui.TextShapingContext('en');
    const buffer = new rmlui.FontMeasureBuffer(1, 6);
    buffer.append('AVATAR');
    let index = 0;
    for (let direction = 0; direction < 3; ++direction) {
      for (let kerning = 0; kerning < 3; ++kerning) {
        for (const spacing of [ 0, 2.75, -1.25 ]) {
          shaping.enums.set([ direction, kerning ]);
          shaping.values[0] = spacing;
          const expected = reference.widths[index++];
          assert.equal(engine.getStringWidth(face, 'AVATAR', shaping, 65),
            expected);
          const bulk = engine.getStringWidths(face, [ 'AVATAR' ], shaping, 65);
          assert.equal(bulk[0], expected);
          assert.equal(engine.measureStrings(face, buffer, shaping, 65)[0],
            expected);
        }
      }
    }
    assert.equal(index, 27);
    const name = `native-managed-font-widths-three-paths-${reference.size}`;
    console.log(`PASS ${name}`);
  }
} finally {
  rmlui.shutdown();
  window.close();
}
