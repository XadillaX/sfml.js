'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { packageRoot, catalog } = require('../catalog.cjs');
const { sequences } = require('./catalog.cjs');

const output = path.resolve(process.argv[2]);
assert.ok(fs.statSync(output).isDirectory());
assert.ok(!output.startsWith(`${packageRoot}${path.sep}`));
const pages = catalog().filter(page => Object.hasOwn(sequences, page.name));
assert.equal(pages.length, Object.keys(sequences).length);
fs.writeFileSync(path.join(output, 'manifest.tsv'),
  pages.map(page => `${page.name}\t${page.file}`).join('\n') + '\n');
fs.writeFileSync(path.join(output, 'actions.tsv'),
  pages.flatMap(page => sequences[page.name].map(action =>
    [ page.name, ...action ].join('\t'))).join('\n') + '\n');
fs.writeFileSync(path.join(output, 'catalog.json'),
  JSON.stringify(pages, null, 2) + '\n');
console.log(`Prepared ${pages.length} original pages for live interaction`);
