'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const packageRoot = path.resolve(__dirname, '../..');
const upstream = path.join(packageRoot, 'third_party/rmlui');
const visualRoot = path.join(upstream, 'Tests/Data/VisualTests');

/**
 * Read upstream metadata without modifying any of the test documents.
 * @param {string} tag Raw XML tag.
 */
function attributes(tag) {
  return Object.fromEntries(Array.from(tag.matchAll(
    /([\w-]+)\s*=\s*(["'])(.*?)\2/gs),
  match => [ match[1].toLowerCase(), match[3] ]));
}

function catalog() {
  return fs.readdirSync(visualRoot).filter(name => name.endsWith('.rml'))
    .sort()
    .map(filename => {
      const file = path.join(visualRoot, filename);
      const source = fs.readFileSync(file, 'utf8');
      const metadata = Array.from(source.matchAll(/<meta\b[^>]*>/gi),
        match => attributes(match[0]));
      const links = Array.from(source.matchAll(/<link\b[^>]*>/gi),
        match => attributes(match[0]));
      const reference = links.find(link => link.rel === 'match')?.href;
      return {
        name: filename.slice(0, -4), file,
        sha256: crypto.createHash('sha256').update(source).digest('hex'),
        metadata,
        reference: reference ? path.resolve(visualRoot, reference) : null,
      };
    });
}

function captures(pages) {
  return pages.flatMap(page => [
    { name: page.name, file: page.file },
    ...(page.reference ? [{
      name: `match-${page.name}`, file: page.reference,
    }] : []),
  ]);
}

module.exports = { packageRoot, upstream, catalog, captures };
