'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const rmlui = require('../../dist');

const expected = {
  harfbuzz: process.env.RMLUI_EXPECT_HARFBUZZ !== '0',
  bitmap: process.env.RMLUI_EXPECT_BITMAP !== '0',
};
const capabilities = rmlui.getCapabilities();
for (const [ kind, compiled ] of Object.entries(expected)) {
  assert.equal(capabilities.fonts[kind].compiled, compiled);
  assert.equal(capabilities.fonts[kind].available, false);
  if (compiled) {
    assert.equal(new rmlui.FontEngineInterface(kind).kind, kind);
  } else {
    assert.throws(() => new rmlui.FontEngineInterface(kind), /not compiled/i);
  }
}
assert.equal(new rmlui.FontEngineInterface().kind, 'freetype');
assert.equal(new rmlui.FontEngineInterface({}).kind, 'custom');
console.log('PASS compiled-font-configuration-and-unavailable-construction');

const fragment = fs.readFileSync(path.join(__dirname,
  '../../native/generated/rmlui-deps.gypi'), 'utf8');
const generated = JSON.parse(fragment.slice(fragment.indexOf('\n') + 1));
const sources = generated.variables;
assert.equal(sources.rmlui_harfbuzz_sources.length, 11);
assert.equal(sources.rmlui_bitmap_font_sources.length, 2);
for (const group of [
  sources.rmlui_harfbuzz_sources, sources.rmlui_bitmap_font_sources,
]) {
  assert.ok(group.every(file => !file.endsWith('/main.cpp')));
  assert.ok(group.every(file => fs.existsSync(path.join(__dirname,
    '../..', file))));
}
console.log('PASS upstream-font-source-groups-exclude-sample-entry-points');
