'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const rmlui = require('../../../dist');

const nativeMeshes = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const color = { red: 60, green: 30, blue: 10, alpha: 120 };
const meshes = Array.from({ length: 5 }, () => new rmlui.Mesh());
rmlui.MeshUtilities.generateQuad(meshes[0], { x: 2, y: 3 },
  { x: 4, y: 5 }, color);
rmlui.MeshUtilities.generateQuad(meshes[1], { x: 10, y: 20 },
  { x: 2, y: 3 }, color, { x: 0.25, y: 0.5 }, { x: 0.75, y: 1 });
rmlui.MeshUtilities.generateLine(meshes[2], { x: 0.4, y: 0.6 },
  { x: 2.4, y: 1.6 }, color);
const sharp = new rmlui.RenderBox(
  { x: 10, y: 20 }, { x: 2, y: 3 }, [ 1, 2, 3, 4 ], [ 0, 0, 0, 0 ]);
rmlui.MeshUtilities.generateBackground(meshes[3], sharp, color);
const rounded = new rmlui.RenderBox(
  { x: 30, y: 20 }, { x: 2, y: 3 }, [ 1, 2, 3, 4 ], [ 15, 9, 7, 5 ]);
rmlui.MeshUtilities.generateBackgroundBorder(meshes[4], rounded, color, [
  { red: 120, green: 0, blue: 0, alpha: 120 },
  { red: 0, green: 120, blue: 0, alpha: 120 },
  { red: 0, green: 0, blue: 120, alpha: 120 },
  { red: 0, green: 90, blue: 90, alpha: 120 },
]);

for (let i = 0; i < meshes.length; ++i) {
  assert.deepEqual([ ...meshes[i].vertices ], nativeMeshes[i].vertices);
  assert.deepEqual([ ...meshes[i].indices ], nativeMeshes[i].indices);
  console.log(`PASS native-managed-utility-byte-equivalence-${i}`);
}
