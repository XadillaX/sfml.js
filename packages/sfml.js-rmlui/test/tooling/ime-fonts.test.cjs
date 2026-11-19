'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const {
  parseFontDownloads, prepareImeFonts,
} = require('../../tools/dependencies/prepare-ime-fonts.cjs');

const rmluiRoot = path.join(__dirname, '../../third_party/rmlui');
const cmakeRelative = 'Samples/basic/ime/CMakeLists.txt';
const assetsRelative = 'Samples/assets/external';

function digest(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

(async () => {
  const original = await fs.readFile(
    path.join(rmluiRoot, cmakeRelative), 'utf8');
  const fonts = parseFontDownloads(original);
  assert.equal(fonts.length, 5);
  assert.equal(fonts[0].file, 'NotoSansSC[wght].ttf');
  assert.equal(fonts[3].file, 'NotoSansThai[wdth,wght].ttf');
  assert.equal(fonts[0].sha256,
    'a3041811a78c361b1de50f953c805e0244951c21c5bd412f7232ef0d899af0da');
  assert.ok(fonts.every(font => new URL(font.url).protocol === 'https:'));
  assert.throws(() => parseFontDownloads(''), /five font downloads/);
  assert.throws(() => parseFontDownloads(original.replace(
    'NotoSansSC[wght].ttf', '../NotoSansSC[wght].ttf')),
  /Unsafe font filename/);
  assert.throws(() => parseFontDownloads(original.replace(
    fonts[0].sha256, 'invalid')), /SHA-256/);
  assert.throws(() => parseFontDownloads(original.replace(
    'https://github.com/google/fonts', 'http://github.com/google/fonts')),
  /HTTPS/);
  assert.throws(() => parseFontDownloads(original.replace(
    'NotoSansJP[wght].ttf', 'NotoSansSC[wght].ttf')), /Duplicate font/);
  console.log('PASS ime-font-original-cmake-manifest-validation');

  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'rmlui-ime-fonts-'));
  try {
    const payloads = fonts.map((font, index) =>
      Buffer.from(`Font fixture ${index}: ${font.file}`));
    let fixture = original;
    for (let index = 0; index < fonts.length; ++index) {
      fixture = fixture.replace(fonts[index].sha256, digest(payloads[index]));
    }
    await fs.mkdir(path.dirname(path.join(root, cmakeRelative)),
      { recursive: true });
    await fs.writeFile(path.join(root, cmakeRelative), fixture);
    let downloads = 0;
    const fetchFont = async url => {
      ++downloads;
      return payloads[fonts.findIndex(font => font.url === url)];
    };
    const first = await prepareImeFonts({ rmluiRoot: root, fetchFont });
    assert.equal(downloads, 5);
    assert.ok(first.every(font => font.status === 'downloaded'));

    const cached = await prepareImeFonts({
      rmluiRoot: root,
      fetchFont: async () => assert.fail('Verified cache must not download'),
    });
    assert.ok(cached.every(font => font.status === 'cached'));
    console.log('PASS ime-font-download-and-verified-cache-reuse');

    const damaged = path.join(root, assetsRelative, fonts[0].file);
    await fs.writeFile(damaged, 'damaged');
    await assert.rejects(prepareImeFonts({
      rmluiRoot: root,
      fetchFont: async () => Buffer.from('incorrect response'),
    }), /Font checksum mismatch: NotoSansSC/);
    assert.equal(await fs.readFile(damaged, 'utf8'), 'damaged');
    assert.deepEqual((await fs.readdir(path.dirname(damaged))).sort(),
      fonts.map(font => font.file).sort());

    const repaired = await prepareImeFonts({ rmluiRoot: root, fetchFont });
    assert.equal(downloads, 6);
    assert.equal(repaired[0].status, 'downloaded');
    assert.ok(repaired.slice(1).every(font => font.status === 'cached'));
    assert.deepEqual(await fs.readFile(damaged), payloads[0]);
    console.log('PASS ime-font-corrupt-cache-repair-and-checksum-failure');
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }

  const cached = await prepareImeFonts({
    rmluiRoot,
    fetchFont: async () => assert.fail('Do not download the existing fonts'),
  });
  assert.equal(cached.length, 5);
  assert.ok(cached.every(font => font.status === 'cached'));
  console.log('PASS ime-font-five-original-installed-sha256-digests');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
