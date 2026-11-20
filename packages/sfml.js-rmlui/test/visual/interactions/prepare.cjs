'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { packageRoot, catalog } = require('../catalog.cjs');
const { sequences } = require('./catalog.cjs');
const { required } = require('./coverage.cjs');

const output = path.resolve(process.argv[2]);
assert.ok(fs.statSync(output).isDirectory());
assert.ok(!output.startsWith(`${packageRoot}${path.sep}`));
const allPages = catalog();
const pages = allPages.filter(page => Object.hasOwn(sequences, page.name));
assert.equal(pages.length, Object.keys(sequences).length);
const requiredPages = required(allPages);
assert.ok(requiredPages.every(name => Object.hasOwn(sequences, name)));
fs.writeFileSync(path.join(output, 'coverage.json'),
  JSON.stringify({
    required: requiredPages,
    covered: pages.map(page => page.name),
    withoutOriginalInteractions: allPages.filter(
      page => !requiredPages.includes(page.name)).map(page => page.name),
  }, null, 2) + '\n');
fs.writeFileSync(path.join(output, 'manifest.tsv'),
  pages.map(page => `${page.name}\t${page.file}`).join('\n') + '\n');
fs.writeFileSync(path.join(output, 'actions.tsv'),
  pages.flatMap(page => sequences[page.name].map(action =>
    [ page.name, ...action ].join('\t'))).join('\n') + '\n');
fs.writeFileSync(path.join(output, 'catalog.json'),
  JSON.stringify(pages, null, 2) + '\n');
console.log(`Prepared ${pages.length} original pages for live interaction`);
