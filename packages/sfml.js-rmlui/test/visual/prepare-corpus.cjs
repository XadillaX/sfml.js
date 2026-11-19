'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { packageRoot, catalog, captures } = require('./catalog.cjs');

const output = path.resolve(process.argv[2]);
assert.ok(fs.statSync(output).isDirectory());
assert.ok(!output.startsWith(`${packageRoot}${path.sep}`));
const pages = catalog();
assert.equal(pages.length, 113);
for (const scene of captures(pages)) {
  assert.ok(fs.statSync(scene.file).isFile(), scene.file);
}
fs.writeFileSync(path.join(output, 'catalog.json'),
  JSON.stringify(pages, null, 2) + '\n');
fs.writeFileSync(path.join(output, 'manifest.tsv'),
  captures(pages).map(scene => `${scene.name}\t${scene.file}`)
    .join('\n') + '\n');
console.log(`Prepared ${pages.length} pages and ` +
  `${pages.filter(page => page.reference).length} upstream match documents`);
