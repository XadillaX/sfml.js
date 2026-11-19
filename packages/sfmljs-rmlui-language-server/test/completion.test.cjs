'use strict';

const assert = require('node:assert');
const {
  completeRcss,
  completeRml,
} = require('../dist/util/completion');

const symbols = {
  ids: [ 'window', 'ok' ],
  classes: [ 'card', 'muted' ],
};

const propertyItems = completeRcss(
  { kind: 'property', prefix: 'flex', range: { start: 0, end: 4 },
    atRuleScope: null },
  symbols,
  [ '--brand' ]
);
const propertyLabels = propertyItems.map(item => item.label);
assert.ok(propertyLabels.includes('flex'));
assert.ok(propertyLabels.includes('flex-direction'));

const customItems = completeRcss(
  { kind: 'property', prefix: '--', range: { start: 0, end: 2 },
    atRuleScope: null },
  symbols,
  [ '--brand' ]
);
assert.ok(customItems.some(item => item.label === '--brand'));

const valueItems = completeRcss(
  { kind: 'value', property: 'display', prefix: '', range: {
    start: 0, end: 0 } },
  symbols,
  []
);
assert.ok(valueItems.some(item => item.label === 'flex'));
assert.ok(valueItems.some(item => item.label === 'none'));

const colorItems = completeRcss(
  { kind: 'value', property: 'color', prefix: '', range: {
    start: 0, end: 0 } },
  symbols,
  []
);
assert.ok(colorItems.some(item => item.kind === 'color'));

const transformItems = completeRcss(
  { kind: 'value', property: 'transform', prefix: 'rot', range: {
    start: 0, end: 3 } },
  symbols,
  []
);
assert.ok(transformItems.some(item => item.label === 'rotate()'));

const idSelectorItems = completeRcss(
  { kind: 'selector', prefix: '#', range: { start: 0, end: 1 } },
  symbols,
  []
);
assert.ok(idSelectorItems.some(item => item.label === '#window'));

const pseudoSelectorItems = completeRcss(
  { kind: 'selector', prefix: ':', range: { start: 0, end: 1 } },
  symbols,
  []
);
assert.ok(pseudoSelectorItems.some(item => item.label === ':hover'));

const atRuleItems = completeRcss(
  { kind: 'at-rule', prefix: '@', range: { start: 0, end: 1 } },
  symbols,
  []
);
assert.ok(atRuleItems.some(item => item.label === '@media'));
assert.ok(atRuleItems.some(item => item.label === '@keyframes'));

const tagItems = completeRml(
  { kind: 'tag', prefix: 'in', range: { start: 0, end: 2 },
    closing: false },
  symbols
);
assert.ok(tagItems.some(item => item.label === 'input'));

const attrItems = completeRml(
  { kind: 'attribute', tag: 'input', prefix: 'data-', range: {
    start: 0, end: 5 } },
  symbols
);
assert.ok(attrItems.some(item => item.label === 'data-value'));

const typeItems = completeRml(
  { kind: 'attributeValue', tag: 'input', attribute: 'type', prefix: '',
    range: { start: 0, end: 0 } },
  symbols
);
assert.ok(typeItems.some(item => item.label === 'checkbox'));

const eventItems = completeRml(
  { kind: 'attributeValue', tag: 'button',
    attribute: 'data-event-click', prefix: '', range: { start: 0, end: 0 } },
  symbols
);
assert.ok(eventItems.some(item => item.label === 'click'));

const classItems = completeRml(
  { kind: 'attributeValue', tag: 'div', attribute: 'class', prefix: 'm',
    range: { start: 0, end: 1 } },
  symbols
);
assert.ok(classItems.some(item => item.label === 'muted'));

console.log('completion tests passed');
