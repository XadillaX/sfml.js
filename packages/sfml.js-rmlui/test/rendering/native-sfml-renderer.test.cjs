'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

if (process.platform !== 'darwin') {
  console.log('SKIP native SFML protocol probe: macOS object-link runner only');
} else {
  const output = path.join(process.env.RUNNER_TEMP ?? os.tmpdir(),
    'sfmljs-rmlui-renderer-contracts');
  fs.mkdirSync(output, { recursive: true });
  const helper = path.resolve(__dirname,
    '../native/rendering/build-sfml-renderer-contracts.py');
  const references = path.join(output, 'gl3-reference');
  fs.mkdirSync(references, { recursive: true });
  const referenceHelper = path.resolve(__dirname,
    '../native/rendering/reference/build-gl3-reference.py');
  const referenceArgs = [ referenceHelper, references ];
  const referenceResult = spawnSync('python3', referenceArgs, {
    cwd: path.resolve(__dirname, '../..'),
    encoding: 'utf8',
    timeout: 90000,
  });
  process.stdout.write(referenceResult.stdout ?? '');
  process.stderr.write(referenceResult.stderr ?? '');
  const referenceFailure = referenceResult.error?.message ??
    `pinned GL3 reference failed: ${
      referenceResult.signal ?? referenceResult.status}`;
  assert.equal(referenceResult.status, 0, referenceFailure);
  const referencePasses = referenceResult.stdout.match(/^PASS reference-/gm);
  assert.equal((referencePasses ?? []).length, 16);

  const cssReferenceResult = spawnSync('python3', [
    referenceHelper, references, '--css',
  ], {
    cwd: path.resolve(__dirname, '../..'),
    encoding: 'utf8',
    timeout: 90000,
  });
  process.stdout.write(cssReferenceResult.stdout ?? '');
  process.stderr.write(cssReferenceResult.stderr ?? '');
  assert.equal(cssReferenceResult.status, 0,
    cssReferenceResult.error?.message ??
    `pinned GL3 CSS reference failed: ${
      cssReferenceResult.signal ?? cssReferenceResult.status}`);
  assert.equal((cssReferenceResult.stdout.match(/^PASS reference-css-/gm) ??
    []).length, 10);

  const suites = [
    [ 'renderer', 5 ],
    [ 'shaders', 10 ],
    [ 'effects', 4 ],
    [ 'textures', 10 ],
    [ 'startup', 14 ],
    [ 'targets', 12 ],
    [ 'css', 2 ],
  ];
  for (const [ suite, count ] of suites) {
    const args = [ helper, output, '--suite', suite ];
    if (suite === 'effects' || suite === 'css') {
      args.push('--references', references);
    }
    const result = spawnSync('python3', args, {
      cwd: path.resolve(__dirname, '../..'),
      encoding: 'utf8',
      timeout: 90000,
    });
    process.stdout.write(result.stdout ?? '');
    process.stderr.write(result.stderr ?? '');
    assert.equal(result.status, 0, result.error?.message ??
      `native SFML ${suite} probe failed: ${result.signal ?? result.status}`);
    assert.equal((result.stdout.match(/^PASS native-/gm) ?? []).length, count);
    if (suite === 'effects') {
      const comparisons = result.stdout.match(/^PASS (?:blur|drop-shadow)-/gm);
      assert.equal((comparisons ?? []).length, 16);
    }
    if (suite === 'css') {
      const comparisons = result.stdout.match(/^PASS css-/gm);
      assert.equal((comparisons ?? []).length, 10);
    }
  }
}
