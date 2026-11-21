'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const vm = require('node:vm');
const {
  prepareRmlUiResources,
} = require('../../tools/dependencies/prepare-rmlui-resources.cjs');
const {
  archiveMembers,
} = require('../../tools/dependencies/source-archive.cjs');

/**
 * Produce a small resource archive with a paired pinned manifest.
 * @param {string} directory Temporary fixture directory.
 * @param {string} version Upstream release identity.
 * @return {Promise<object>} Resource preparer options.
 */
async function fixture(directory, version) {
  const sourceRoot = path.join(directory, 'source');
  const root = path.join(directory, 'upstream');
  const files = {
    'Samples/assets/font.ttf': `font-${version}`,
    'Samples/basic/demo/data/page.rml': `page-${version}`,
    'Samples/invaders/data/scores.txt': `score-${version}`,
    'Tests/Data/VisualTests/layout.rml': `test-${version}`,
  };
  const hashes = {};
  for (const [ filename, content ] of Object.entries(files)) {
    const target = path.join(root, filename);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content);
    hashes[filename] = createHash('sha256').update(content).digest('hex');
  }
  const result = spawnSync('tar', [ '-czf', 'upstream.tar.gz', 'upstream' ],
    { cwd: directory, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const archivePath = path.join(directory, 'upstream.tar.gz');
  const dependency = {
    version, repository: 'mikke89/RmlUi', commit: '1'.repeat(40),
    sha256: createHash('sha256').update(await fs.readFile(archivePath))
      .digest('hex'),
  };
  await fs.mkdir(sourceRoot);
  await fs.writeFile(path.join(sourceRoot, 'resources.json'),
    JSON.stringify({ dependency, files: hashes }));
  return { sourceRoot, archivePath };
}

(async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'resource-test-'));
  try {
    const first = await fixture(directory, '6.3');
    const target = path.join(directory, 'cache');
    const options = { ...first, target };
    assert.equal((await prepareRmlUiResources(options)).status, 'prepared');
    const offline = () => assert.fail('Complete cache must not download');
    assert.equal((await prepareRmlUiResources({
      sourceRoot: first.sourceRoot, target, fetchArchive: offline,
    })).status, 'cached');
    const extra = path.join(target, 'Samples/assets/external/ime.ttf');
    await fs.mkdir(path.dirname(extra));
    await fs.writeFile(extra, 'extra font');
    const scores = path.join(target, 'Samples/invaders/data/scores.txt');
    await fs.writeFile(scores, 'player score');
    const missing = path.join(target, 'Samples/assets/font.ttf');
    await fs.rm(missing);
    await prepareRmlUiResources(options);
    assert.equal(await fs.readFile(scores, 'utf8'), 'player score');
    assert.equal(await fs.readFile(extra, 'utf8'), 'extra font');
    assert.equal(await fs.readFile(missing, 'utf8'), 'font-6.3');

    const nextRoot = path.join(directory, 'next');
    await fs.mkdir(nextRoot);
    const next = await fixture(nextRoot, '6.4');
    await assert.rejects(prepareRmlUiResources({
      sourceRoot: next.sourceRoot, target,
      fetchArchive: () => Buffer.from('bad archive'),
    }), /checksum/i);
    assert.equal(await fs.readFile(missing, 'utf8'), 'font-6.3');
    await prepareRmlUiResources({ ...next, target });
    assert.equal(await fs.readFile(missing, 'utf8'), 'font-6.4');
    assert.equal(await fs.readFile(scores, 'utf8'), 'player score');
    assert.equal(await fs.readFile(extra, 'utf8'), 'extra font');

    await fs.rm(path.join(target, '.resources.json'));
    await fs.writeFile(path.join(target, 'CMakeLists.txt'),
      'project(RmlUi VERSION "6.4")');
    assert.equal((await prepareRmlUiResources({
      sourceRoot: next.sourceRoot, target, fetchArchive: offline,
    })).status, 'cached');
    console.log('PASS rmlui-resources-cache-repair-version-and-user-data');

    for (const listing of [
      '/root/file', 'root/../file', 'root/file\nother/file',
      'root/file\nroot/file', 'root/dir\\file',
    ]) {
      assert.throws(() => archiveMembers(listing),
        /Unsafe|one upstream root|Duplicate/);
    }
    const manifest = path.join(next.sourceRoot, 'resources.json');
    const data = JSON.parse(await fs.readFile(manifest, 'utf8'));
    data.files['../../escape'] = '0'.repeat(64);
    await fs.writeFile(manifest, JSON.stringify(data));
    await assert.rejects(prepareRmlUiResources({
      ...next, target,
    }), /Unsafe resource/);
    console.log('PASS rmlui-resources-reject-unsafe-paths-and-archives');

    const packageRoot = path.resolve(__dirname, '../..');
    const filename = path.join(packageRoot, 'examples/official.cjs');
    const output = [];
    const localRequire = id => {
      if (id === 'node:util') {
        return { parseArgs: () => ({ values: { list: true } }) };
      }
      if (id.endsWith('/prepare-rmlui-resources.cjs')) {
        return {
          prepareRmlUiResources: () =>
            assert.fail('Listing must not prepare or download resources'),
        };
      }
      if (id === 'sfml.js' || id === '../dist' || id === 'node:fs') {
        assert.fail(`Listing must not access native modules or cache: ${id}`);
      }
      return id.startsWith('.')
        ? require(path.resolve(path.dirname(filename), id)) : require(id);
    };
    vm.runInNewContext(await fs.readFile(filename, 'utf8'), {
      require: localRequire, __dirname: path.dirname(filename),
      process: { exitCode: 0 },
      console: {
        log: message => output.push(message),
        error: error => assert.fail(error.message),
      },
    }, { filename });
    assert.ok(output.some(line => line.includes('Upstream VisualTests')));
    assert.ok(output.some(line => line.startsWith('  visual/')));
    console.log('PASS rmlui-example-list-without-assets-or-native-modules');
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
