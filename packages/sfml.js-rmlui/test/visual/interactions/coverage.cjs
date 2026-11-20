'use strict';

const fs = require('node:fs');

/**
 * Identify original controls and declared live styles without changing markup.
 * @param {object[]} pages Original upstream catalog.
 * @return {string[]} Pages requiring actual input or animation checkpoints.
 */
function required(pages) {
  return pages.filter(page => {
    const source = fs.readFileSync(page.file, 'utf8');
    return /<(?:handle|input|textarea|select|button)\b/i.test(source) ||
      /:(?:hover|active|focus)\b|@keyframes\b|animation\s*:/i.test(source);
  }).map(page => page.name);
}

module.exports = { required };
