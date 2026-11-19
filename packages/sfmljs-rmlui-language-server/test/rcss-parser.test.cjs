'use strict';

const assert = require('node:assert');
const {
  parseRcss,
  getRcssCompletionContext,
  declarationAt,
} = require('../dist/util/rcss-parser');

const sample = `
/* comment */
body {
  width: 100%;
  height: 480dp;
  --brand: #e84c88;
  bogus-property: 1;
}

#panel:hover {
  color: var(--brand);
  display: flex;
}

@media (min-width: 600dp) {
  div {
    font-size: 14dp;
  }
}

@keyframes pulse {
  from { opacity: 0; }
  to { opacity: 1; }
}

.unclosed {
  opacity: 0.5;
`;

const parsed = parseRcss(sample);

const names = parsed.declarations.map(item => item.name);
assert.ok(names.includes('width'));
assert.ok(names.includes('--brand'));
assert.ok(names.includes('opacity'));
assert.strictEqual(parsed.customProperties.includes('--brand'), true);

const unknown = parsed.diagnostics.find(
  item => item.code === 'rcss-unknown-property'
);
assert.ok(unknown, 'unknown property should be reported');
assert.strictEqual(unknown.message.includes('bogus-property'), true);

const unclosed = parsed.diagnostics.find(
  item => item.code === 'rcss-unclosed-block'
);
assert.ok(unclosed, 'unclosed block should be reported');

const pseudo = parsed.pseudoReferences.find(item => item.name === 'hover');
assert.ok(pseudo, 'hover pseudo-class should be indexed');

const unknownPseudo = parseRcss('.a:made-up { color: red; }').diagnostics
  .find(item => item.code === 'rcss-unknown-pseudo-class');
assert.ok(unknownPseudo, 'unknown pseudo-class should be reported');

const clean = parseRcss('a { color: red; }');
assert.strictEqual(clean.diagnostics.length, 0);

const widthOffset = sample.indexOf('width');
const declaration = declarationAt(parsed, widthOffset + 2);
assert.ok(declaration);
assert.strictEqual(declaration.name, 'width');
assert.strictEqual(declaration.value, '100%');

const propertyContext = getRcssCompletionContext(
  sample,
  sample.indexOf('width') + 2
);
assert.strictEqual(propertyContext.kind, 'property');

const valueOffset = sample.indexOf('100%') + 1;
const valueContext = getRcssCompletionContext(sample, valueOffset);
assert.strictEqual(valueContext.kind, 'value');
assert.strictEqual(valueContext.property, 'width');

const selectorOffset = sample.indexOf('#panel');
const selectorContext = getRcssCompletionContext(sample, selectorOffset + 2);
assert.strictEqual(selectorContext.kind, 'selector');

const atOffset = sample.indexOf('@media') + 2;
const atContext = getRcssCompletionContext(sample, atOffset);
assert.strictEqual(atContext.kind, 'at-rule');

const mediaProperty = parsed.declarations.find(
  item => item.name === 'font-size'
);
assert.ok(mediaProperty);
assert.strictEqual(mediaProperty.atRuleScope, null);

console.log('rcss-parser tests passed');
