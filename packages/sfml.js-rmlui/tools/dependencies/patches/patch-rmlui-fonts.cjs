'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

/**
 * Remove obsolete manual expansion before RmlUi 6.3's appending quad helper.
 * @param {string} root Extracted pinned RmlUi source tree.
 */
async function patchRmlUiFonts(root) {
  const file = path.join(root,
    'Samples/basic/bitmap_font/src/FontEngineBitmap.cpp');
  const source = await fs.readFile(file, 'utf8');
  const before = [
    '\t\t// Generate the geometry for the character.',
    '\t\tvertices.resize(vertices.size() + 4);',
    '\t\tindices.resize(indices.size() + 6);',
    '',
    '\t\tVector2f uv_top_left = glyph.position / texture_dimensions;',
  ].join('\n');
  const after = [
    '\t\t// GenerateQuad appends the character vertices and indices.',
    '\t\tVector2f uv_top_left = glyph.position / texture_dimensions;',
  ].join('\n');
  if (source.includes(after)) {
    return;
  }
  if (source.split(before).length !== 2) {
    throw new Error(`RmlUi bitmap font patch mismatch: ${file}`);
  }
  await fs.writeFile(file, source.replace(before, after));
}

module.exports = { patchRmlUiFonts };
