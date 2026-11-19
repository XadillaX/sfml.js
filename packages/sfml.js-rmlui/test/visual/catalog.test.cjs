'use strict';

const assert = require('node:assert/strict');
const { catalog } = require('./catalog.cjs');

const pages = catalog();
assert.equal(pages.length, 113);

const cases = [
  [
    'position_05_floating_a_box_clear',
    'description',
    'Now the "sibling" text moves down to below the "inner" text’s box, ' +
      'leaving blank space behind. The text following the "sibling" text ' +
      'flows after it as normal.',
  ],
  [
    'ink_overflow_bounding_box',
    'Description',
    "Enables testing an element's bounding box with ink overflow and " +
      'transform. The bounding box should cover all of the element\'s box ' +
      'shadows and filters, even when they have transforms applied.',
  ],
  [
    'white_space',
    'Assert',
    "The 'I' and 'ABC' lines should be horizontally centered, intersecting " +
      'the vertical guideline.',
  ],
];

for (const [ pageName, metadataName, expected ] of cases) {
  const page = pages.find(item => item.name === pageName);
  const metadata = page.metadata.find(item => item.name === metadataName);
  assert.equal(metadata.content, expected);
  console.log(`PASS visual catalog preserves quoted ${pageName} requirement`);
}
