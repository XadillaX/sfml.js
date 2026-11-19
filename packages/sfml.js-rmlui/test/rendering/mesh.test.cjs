'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

/**
 * Fill both native vectors with nondefault values.
 * @param {object} rmlui Public package.
 * @param {number} vertices Vertex count.
 * @param {number} indices Index count.
 * @return {object} Mesh and retained views.
 */
function populated(rmlui, vertices, indices) {
  const mesh = new rmlui.Mesh(vertices, indices);
  const bytes = mesh.vertices;
  const elements = mesh.indices;
  for (let i = 0; i < bytes.length; ++i) {
    bytes[i] = (i % 251) + 1;
  }
  for (let i = 0; i < elements.length; ++i) {
    elements[i] = i + 7;
  }

  return { mesh, bytes, elements };
}

const cases = {
  'resize-shrink-preserves-prefix-and-independent-old-views': rmlui => {
    const { mesh, bytes, elements } = populated(rmlui, 10, 30);
    const prefix = bytes.slice(0, 3 * rmlui.Mesh.vertexStride);
    mesh.resize(3, 9);

    assert.equal(mesh.vertexCount, 3);
    assert.deepEqual(mesh.vertices, prefix);
    assert.deepEqual([ ...mesh.indices ], [ ...elements.slice(0, 9) ]);
    bytes[0] = 0;
    elements[0] = -1;
    assert.equal(mesh.vertices[0], 1);
    assert.equal(mesh.indices[0], 7);
    mesh.vertices[1] = 0;
    mesh.indices[1] = -2;
    assert.equal(bytes[1], 2);
    assert.equal(elements[1], 8);
    assert.equal(bytes.length, 200);
    assert.equal(elements.length, 30);
  },

  'resize-grow-value-initializes-new-vertices-and-indices': rmlui => {
    const { mesh, bytes, elements } = populated(rmlui, 2, 3);
    mesh.resize(5, 9);

    assert.deepEqual(mesh.vertices.slice(0, bytes.length), bytes);
    assert.deepEqual([ ...mesh.indices.slice(0, elements.length) ],
      [ ...elements ]);
    for (let i = 2; i < 5; ++i) {
      const vertex = mesh.getVertex(i);
      assert.deepEqual(vertex.position, { x: 0, y: 0 });
      assert.deepEqual(vertex.colour,
        { red: 0, green: 0, blue: 0, alpha: 255 });
      assert.deepEqual(vertex.texCoord, { x: 0, y: 0 });
    }
    assert.deepEqual([ ...mesh.indices.slice(3) ], [ 0, 0, 0, 0, 0, 0 ]);
    bytes.fill(0);
    elements.fill(-1);
    assert.equal(mesh.vertices[0], 1);
    assert.equal(mesh.indices[0], 7);
  },

  'resize-same-counts-still-replaces-both-allocations': rmlui => {
    const { mesh, bytes, elements } = populated(rmlui, 3, 9);
    mesh.resize(3, 9);

    assert.deepEqual(mesh.vertices, bytes);
    assert.deepEqual([ ...mesh.indices ], [ ...elements ]);
    bytes[0] = 0;
    elements[0] = -1;
    assert.equal(mesh.vertices[0], 1);
    assert.equal(mesh.indices[0], 7);
  },

  'resize-vectors-can-grow-and-shrink-in-opposite-directions': rmlui => {
    const { mesh, bytes, elements } = populated(rmlui, 4, 3);
    mesh.resize(1, 9);

    assert.deepEqual(mesh.vertices, bytes.slice(0, 20));
    assert.deepEqual([ ...mesh.indices ], [ ...elements, 0, 0, 0, 0, 0, 0 ]);
    mesh.resize(3, 1);
    assert.deepEqual(mesh.vertices.slice(0, 20), bytes.slice(0, 20));
    assert.deepEqual(mesh.getVertex(1).colour,
      { red: 0, green: 0, blue: 0, alpha: 255 });
    assert.deepEqual([ ...mesh.indices ], [ 7 ]);
  },

  'resize-to-zero-preserves-old-views-and-reinitializes-on-growth': rmlui => {
    const { mesh, bytes, elements } = populated(rmlui, 4, 12);
    mesh.resize(0, 0);

    assert.equal(mesh.vertexCount, 0);
    assert.equal(mesh.vertices.length, 0);
    assert.equal(mesh.indices.length, 0);
    assert.equal(mesh.isValid, false);
    assert.equal(bytes[0], 1);
    assert.equal(elements[0], 7);
    mesh.resize(0, 0);
    mesh.resize(1, 3);
    assert.deepEqual(mesh.getVertex(0).position, { x: 0, y: 0 });
    assert.deepEqual(mesh.getVertex(0).colour,
      { red: 0, green: 0, blue: 0, alpha: 255 });
    assert.deepEqual([ ...mesh.indices ], [ 0, 0, 0 ]);
  },

  'resize-rejects-invalid-counts-without-changing-either-vector': rmlui => {
    const { mesh, bytes, elements } = populated(rmlui, 3, 9);
    for (const invalid of [
      -1, 0.5, NaN, Infinity, '3', null, undefined, true, 0xffffffff,
    ]) {
      assert.throws(() => mesh.resize(invalid, 0), RangeError);
      assert.throws(() => mesh.resize(0, invalid), RangeError);
      assert.equal(mesh.vertexCount, 3);
      assert.deepEqual(mesh.vertices, bytes);
      assert.deepEqual([ ...mesh.indices ], [ ...elements ]);
    }

    bytes[0] = 91;
    elements[0] = 42;
    assert.equal(mesh.vertices[0], 91);
    assert.equal(mesh.indices[0], 42);
  },

  'resized-and-retired-views-survive-mesh-collection': async rmlui => {
    let reference;
    let retired;
    let current;
    (() => {
      const { mesh, bytes, elements } = populated(rmlui, 4, 12);
      reference = new WeakRef(mesh);
      retired = { bytes, elements };
      mesh.resize(2, 6);
      current = { bytes: mesh.vertices, elements: mesh.indices };
    })();

    for (let i = 0; i < 12; ++i) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(reference.deref(), undefined);
    retired.bytes[0] = 0;
    retired.elements[0] = -1;
    assert.equal(current.bytes[0], 1);
    assert.equal(current.elements[0], 7);
    current.bytes[1] = 0;
    current.elements[1] = -2;
    assert.equal(retired.bytes[1], 2);
    assert.equal(retired.elements[1], 8);
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
