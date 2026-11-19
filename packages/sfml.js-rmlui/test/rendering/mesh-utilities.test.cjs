'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const color = { red: 60, green: 30, blue: 10, alpha: 120 };
const transparent = { red: 0, green: 0, blue: 0, alpha: 0 };

const cases = {
  'quad-overloads-append-and-preserve-exported-storage': rmlui => {
    const mesh = new rmlui.Mesh();
    rmlui.MeshUtilities.generateQuad(mesh, { x: 2, y: 3 },
      { x: 4, y: 5 }, color);
    const previous = mesh.vertices;
    const previousIndices = mesh.indices;
    const vertex = mesh.getVertex(0);
    assert.deepEqual([ ...previousIndices ], [ 0, 3, 1, 1, 3, 2 ]);
    assert.deepEqual(mesh.getVertex(2).position, { x: 6, y: 8 });
    assert.deepEqual(mesh.getVertex(2).texCoord, { x: 1, y: 1 });
    assert.deepEqual(vertex.colour, color);

    rmlui.MeshUtilities.generateQuad(mesh, { x: 10, y: 20 },
      { x: 2, y: 3 }, color, { x: 0.25, y: 0.5 }, { x: 0.75, y: 1 });
    assert.equal(mesh.vertexCount, 8);
    assert.deepEqual([ ...mesh.indices ], [
      0, 3, 1, 1, 3, 2, 4, 7, 5, 5, 7, 6,
    ]);
    assert.deepEqual(mesh.getVertex(5).texCoord, { x: 0.75, y: 0.5 });
    vertex.positionView[0] = 99;
    assert.equal(new Float32Array(previous.buffer)[0], 99);
    assert.equal(mesh.getVertex(0).position.x, 2);
    assert.equal(previousIndices.length, 6);
  },

  'line-snaps-both-edges-to-the-pixel-grid': rmlui => {
    const mesh = new rmlui.Mesh();
    rmlui.MeshUtilities.generateLine(mesh, { x: 0.4, y: 0.6 },
      { x: 2.4, y: 1.6 }, color);
    assert.deepEqual(mesh.getVertex(0).position, { x: 0, y: 1 });
    assert.deepEqual(mesh.getVertex(2).position, { x: 3, y: 2 });
  },

  'background-and-border-use-box-offsets-and-native-triangles': rmlui => {
    const box = new rmlui.RenderBox(
      { x: 10, y: 20 }, { x: 2, y: 3 }, [ 1, 2, 3, 4 ], [ 0, 0, 0, 0 ]);
    const mesh = new rmlui.Mesh();
    rmlui.MeshUtilities.generateBackground(mesh, box, color);
    assert.equal(mesh.vertexCount, 4);
    assert.deepEqual(mesh.getVertex(0).position, { x: 6, y: 4 });
    assert.deepEqual(mesh.getVertex(2).position, { x: 16, y: 24 });
    assert.deepEqual([ ...mesh.indices ], [ 0, 2, 1, 0, 3, 2 ]);
    rmlui.MeshUtilities.generateBackgroundBorder(
      mesh, box, transparent, [ color, color, color, color ]);
    assert.equal(mesh.vertexCount, 12);
    assert.equal(mesh.indices.length, 30);
    assert.deepEqual(mesh.getVertex(5).position, { x: 2, y: 3 });

    const size = mesh.vertexCount;
    rmlui.MeshUtilities.generateBackground(mesh, box, transparent);
    assert.equal(mesh.vertexCount, size);
    box.borderRadius.fill(8);
    const rounded = new rmlui.Mesh();
    rmlui.MeshUtilities.generateBackgroundBorder(
      rounded, box, color, [ color, color, color, color ]);
    assert.ok(rounded.vertexCount > 12);
    for (const index of rounded.indices) {
      assert.ok(index >= 0 && index < rounded.vertexCount);
    }
  },

  'bulk-shared-commands-preserve-order-and-reuse-input': rmlui => {
    const commands = rmlui.MeshUtilities.allocateCommands(3);
    const stride = rmlui.MeshUtilities.commandStride;
    commands.set([ 0, 2, 3, 4, 5, 60, 30, 10, 120, 0, 0, 1, 1 ]);
    commands.set([ 1, 0.4, 0.6, 2.4, 1.6, 60, 30, 10, 120 ], stride);
    commands.set([
      2, 10, 20, 2, 3, 1, 2, 3, 4, 0, 0, 0, 0, 60, 30, 10, 120,
    ], stride * 2);
    const mesh = new rmlui.Mesh();
    rmlui.MeshUtilities.append(mesh, commands);
    assert.equal(mesh.vertexCount, 12);
    assert.equal(mesh.indices.length, 18);
    assert.deepEqual(mesh.getVertex(0).position, { x: 2, y: 3 });
    assert.deepEqual(mesh.getVertex(4).position, { x: 0, y: 1 });
    assert.deepEqual(mesh.getVertex(8).position, { x: 6, y: 4 });
    commands[1] = 8;
    rmlui.MeshUtilities.append(mesh, commands, 1);
    assert.equal(mesh.vertexCount, 16);
    assert.deepEqual(mesh.getVertex(12).position, { x: 8, y: 3 });
  },

  'invalid-batch-does-not-append-a-valid-prefix': rmlui => {
    const mesh = new rmlui.Mesh();
    const commands = rmlui.MeshUtilities.allocateCommands(2);
    commands.set([ 0, 0, 0, 4, 5, 60, 30, 10, 120, 0, 0, 1, 1 ]);
    commands[rmlui.MeshUtilities.commandStride] = 99;
    assert.throws(() => rmlui.MeshUtilities.append(mesh, commands), RangeError);
    assert.equal(mesh.vertexCount, 0);
    assert.equal(mesh.indices.length, 0);

    commands[rmlui.MeshUtilities.commandStride] = 0;
    commands[5] = 256;
    assert.throws(() => rmlui.MeshUtilities.append(mesh, commands), RangeError);
    commands[5] = 60;
    commands[1] = Infinity;
    assert.throws(() => rmlui.MeshUtilities.append(mesh, commands), RangeError);
    assert.throws(() => rmlui.MeshUtilities.append(mesh, commands, 3),
      RangeError);
    assert.throws(() => rmlui.MeshUtilities.append(mesh, new Float32Array(1)),
      RangeError);
    assert.throws(() => rmlui.MeshUtilities.generateBackground(
      mesh, {}, color), TypeError);
    assert.equal(mesh.vertexCount, 0);
  },

  'convenience-arguments-do-not-silently-coerce-or-round-colours': rmlui => {
    const mesh = new rmlui.Mesh();
    for (const red of [ '60', 60.00000001, true, null ]) {
      assert.throws(() => rmlui.MeshUtilities.generateQuad(
        mesh, { x: 0, y: 0 }, { x: 4, y: 5 }, { ...color, red }),
      /colour/i);
    }
    assert.throws(() => rmlui.MeshUtilities.generateLine(
      mesh, { x: '1', y: 0 }, { x: 4, y: 5 }, color), /coordinate/i);
    assert.equal(mesh.vertexCount, 0);
  },

  'shared-command-and-geometry-views-survive-owner-collection': async rmlui => {
    let reference;
    let vertices;
    let indices;
    (() => {
      const mesh = new rmlui.Mesh();
      rmlui.MeshUtilities.generateQuad(mesh, { x: 1, y: 2 },
        { x: 3, y: 4 }, color);
      reference = new WeakRef(mesh);
      vertices = mesh.vertices;
      indices = mesh.indices;
    })();
    const commands = rmlui.MeshUtilities.allocateCommands(1);
    commands.set([ 0, 1, 2, 3, 4, 60, 30, 10, 120, 0, 0, 1, 1 ]);

    for (let i = 0; i < 12; ++i) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(reference.deref(), undefined);
    rmlui.shutdown();
    assert.deepEqual([ ...indices ], [ 0, 3, 1, 1, 3, 2 ]);
    assert.deepEqual([ ...new Float32Array(vertices.buffer).subarray(0, 2) ],
      [ 1, 2 ]);
    commands[1] = 8;
    const next = new rmlui.Mesh();
    rmlui.MeshUtilities.append(next, commands);
    assert.equal(next.getVertex(0).position.x, 8);
  },
};

if (process.argv[2]) {
  Promise.resolve().then(() =>
    cases[process.argv[2]](require('../../dist'))).catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  for (const name of Object.keys(cases)) {
    const child = spawnSync(process.execPath, [
      '--expose-gc', __filename, name,
    ], {
      encoding: 'utf8', timeout: 30000,
    });
    assert.equal(child.status, 0, `${name}\n${child.stdout}${child.stderr}`);
    console.log(`PASS ${name}`);
  }
}
