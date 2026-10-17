import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { auditHtmlFiles } from './check.mjs';

async function fixture(t, files) {
  const directory = await mkdtemp(join(tmpdir(), 'sfml-site-check-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  for (const [ path, content ] of Object.entries(files)) {
    await mkdir(join(directory, path, '..'), { recursive: true });
    await writeFile(join(directory, path), content);
  }
  return directory;
}

test('checks clean routes, relative assets, query strings and encoded fragments against real output', async t => {
  const directory = await fixture(t, {
    'index.html': '<a href="/ja/guide/?q=1#%E6%A6%82%E8%A6%81">Guide</a><a href="/guide/system#input-streams">System</a>',
    'ja/guide/index.html': '<h1 id="概要">Guide</h1><img src="../../media/scene.png"><a href="/">Home</a>',
    'media/scene.png': 'image fixture',
    'guide/system.html': '<h2 id="input-streams">Streams</h2><a href="https://example.com/no-local-file">External</a>',
  });
  assert.deepEqual(await auditHtmlFiles(directory), []);
});

test('reports missing local pages, images and anchors without confusing external URLs', async t => {
  const directory = await fixture(t, {
    'index.html': '<a href="/ko/guide/missing">Missing</a><img src="/media/missing.png"><a href="/guide/#wrong">Anchor</a>',
    'guide/index.html': '<h1 id="right">Guide</h1><a href="mailto:hello@example.com">Email</a>',
  });
  const errors = await auditHtmlFiles(directory);
  assert.equal(errors.length, 3);
  assert.ok(errors.some(error => error.includes('/ko/guide/missing')));
  assert.ok(errors.some(error => error.includes('/media/missing.png')));
  assert.ok(errors.some(error => error.includes('#wrong')));
});

test('validates image srcset entries and HTML character references', async t => {
  const directory = await fixture(t, {
    'index.html': '<img srcset="/media/small.png 1x, /media/large.png 2x"><a href="/guide/?a=1&amp;b=2#ready">Guide</a>',
    'media/small.png': 'small image fixture',
    'guide/index.html': '<h1 id="ready">Guide</h1>',
  });
  const errors = await auditHtmlFiles(directory);
  assert.equal(errors.length, 1);
  assert.ok(errors[0].includes('/media/large.png'));
});

test('treats absolute sfml.js.org links as local output that must exist', async t => {
  const directory = await fixture(t, {
    'index.html': '<a href="https://sfml.js.org/reference/#api">API</a><a href="https://sfml.js.org/guide/missing">Missing</a>',
    'reference/index.html': '<h1 id="api">API</h1>',
  });
  const errors = await auditHtmlFiles(directory);
  assert.equal(errors.length, 1);
  assert.ok(errors[0].includes('https://sfml.js.org/guide/missing'));
});
