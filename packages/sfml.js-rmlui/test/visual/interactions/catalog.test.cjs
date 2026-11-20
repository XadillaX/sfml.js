'use strict';

const assert = require('node:assert/strict');
const { catalog } = require('../catalog.cjs');
const { sequences } = require('./catalog.cjs');
const { required } = require('./coverage.cjs');

const pages = catalog();
const names = new Set(pages.map(page => page.name));
const requiredPages = required(pages);
for (const name of requiredPages) {
  assert.ok(Object.hasOwn(sequences, name),
    `${name}: missing original input coverage`);
}
for (const [ name, actions ] of Object.entries(sequences)) {
  assert.ok(names.has(name), `${name}: unknown upstream page`);
  const captures = actions.filter(([ verb ]) => verb === 'capture')
    .map(([ , checkpoint ]) => checkpoint);
  assert.ok(captures.length > 0, `${name}: no captured input result`);
  assert.equal(new Set(captures).size, captures.length,
    `${name}: duplicate checkpoint`);
}
console.log(`PASS ${requiredPages.length} interactive original pages` +
  ' all have literal sequences');
