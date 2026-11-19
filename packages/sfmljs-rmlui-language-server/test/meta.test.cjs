'use strict';

const assert = require('node:assert');
const {
  RCSS_PROPERTIES,
  PSEUDO_CLASSES,
  AT_RULES,
  NAMED_COLORS,
  getPropertyMeta,
  isKnownProperty,
  getPseudoMeta,
  getPropertyDocUrl,
} = require('../dist/meta/rcss-meta');
const {
  RML_TAGS,
  GLOBAL_ATTRIBUTES,
  RML_EVENTS,
  getTagMeta,
} = require('../dist/meta/rml-meta');

const propertyNames = RCSS_PROPERTIES.map(property => property.name);
assert.strictEqual(
  new Set(propertyNames).size,
  propertyNames.length,
  'property names must be unique'
);
for (const property of RCSS_PROPERTIES) {
  assert.ok(property.values.length > 0, `${property.name} has values`);
  assert.ok(property.description.length > 0, `${property.name} has docs`);
  assert.match(getPropertyDocUrl(property), /^https:\/\//);
}

assert.ok(isKnownProperty('display'));
assert.ok(isKnownProperty('--custom'));
assert.strictEqual(isKnownProperty('not-a-property'), false);
assert.strictEqual(getPropertyMeta('DISPLAY').name, 'display');

const pseudoNames = PSEUDO_CLASSES.map(pseudo => pseudo.name);
assert.strictEqual(new Set(pseudoNames).size, pseudoNames.length);
assert.ok(getPseudoMeta('nth-child').functional);

const atRuleNames = AT_RULES.map(rule => rule.name);
for (const name of [ 'media', 'keyframes', 'font-face', 'spritesheet',
  'decorator' ]) {
  assert.ok(atRuleNames.includes(name), `at-rule ${name} registered`);
}

assert.strictEqual(NAMED_COLORS.white, '#ffffff');
assert.strictEqual(NAMED_COLORS.transparent, '#00000000');

const tagNames = RML_TAGS.map(tag => tag.name);
assert.strictEqual(new Set(tagNames).size, tagNames.length);
assert.ok(getTagMeta('tabset'));
assert.ok(getTagMeta('input').attributes.includes('type'));
assert.ok(getTagMeta('link').void);

const globalNames = GLOBAL_ATTRIBUTES.map(attr => attr.name);
assert.ok(globalNames.includes('data-for'));
assert.ok(globalNames.includes('data-event-*'));
assert.ok(RML_EVENTS.includes('click'));
assert.ok(RML_EVENTS.includes('tabchange'));

console.log('meta tests passed');
