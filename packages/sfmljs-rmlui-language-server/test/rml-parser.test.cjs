'use strict';

const assert = require('node:assert');
const {
  parseRml,
  getRmlCompletionContext,
} = require('../dist/util/rml-parser');

const sample = `
<rml>
  <head>
    <title>Test</title>
    <link type="text/rcss" href="style.rcss" />
    <style>
      body { color: red; }
    </style>
  </head>
  <body>
    <!-- comment <not-a-tag> -->
    <div id="window" class="card muted">
      <button id="ok" data-event-click="confirm()">OK</button>
      <input type="checkbox" checked />
      <img src="icon.png" />
    </div>
  </body>
</rml>
`;

const parsed = parseRml(sample);
const tags = parsed.elements.map(element => element.tag);
assert.ok(tags.includes('rml'));
assert.ok(tags.includes('link'));
assert.ok(tags.includes('button'));
assert.ok(tags.includes('img'));
assert.strictEqual(tags.includes('not-a-tag'), false);
assert.strictEqual(parsed.diagnostics.length, 0);

const link = parsed.elements.find(element => element.tag === 'link');
assert.strictEqual(link.selfClosing, true);
const href = link.attributes.find(attr => attr.name === 'href');
assert.strictEqual(href.value, 'style.rcss');

assert.deepStrictEqual(parsed.ids, [ 'window', 'ok' ]);
assert.deepStrictEqual(parsed.classes, [ 'card', 'muted' ]);

assert.strictEqual(parsed.links.length, 2);
assert.strictEqual(parsed.links[0].target, 'style.rcss');
assert.strictEqual(parsed.links[1].target, 'icon.png');

const button = parsed.elements.find(element => element.tag === 'button');
const eventAttr = button.attributes.find(
  attr => attr.name === 'data-event-click'
);
assert.strictEqual(eventAttr.value, 'confirm()');

const mismatched = parseRml('<rml><body><div></body></div></rml>');
assert.ok(
  mismatched.diagnostics.some(item => item.code === 'rml-mismatched-tag')
);

const unclosed = parseRml('<rml><body><div>text</body></rml>');
assert.ok(
  unclosed.diagnostics.some(item => item.code === 'rml-unclosed-tag')
);

const strayClose = parseRml('</div>');
assert.ok(
  strayClose.diagnostics.some(item => item.code === 'rml-mismatched-tag')
);

const tagOffset = sample.indexOf('<button') + 1;
const tagContext = getRmlCompletionContext(sample, tagOffset + 3);
assert.strictEqual(tagContext.kind, 'tag');

const attrOffset = sample.indexOf('id="ok"') + 1;
const attrContext = getRmlCompletionContext(sample, attrOffset);
assert.strictEqual(attrContext.kind, 'attribute');
assert.strictEqual(attrContext.tag, 'button');

const valueOffset = sample.indexOf('"checkbox"') + 1;
const valueContext = getRmlCompletionContext(sample, valueOffset);
assert.strictEqual(valueContext.kind, 'attributeValue');
assert.strictEqual(valueContext.attribute, 'type');

console.log('rml-parser tests passed');
