import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'parse5';
import { generateRedirects, redirectHtml } from './redirects.mjs';

test('legacy redirect keeps the destination path, ' +
     'query and method fragment at runtime', () => {
  const html = redirectHtml('classes/RenderWindow.html');
  const tree = parse(html);
  const nodes = [];
  function walk(node) {
    nodes.push(node);
    for (const child of node.childNodes || []) {
      walk(child);
    }
  }
  walk(tree);
  const scripts = nodes.filter(node => node.tagName === 'script');
  assert.equal(scripts.length, 1);
  let actual;
  vm.runInNewContext(scripts[0].childNodes[0].value, {
    location: {
      search: '?from=bookmark',
      hash: '#draw',
      replace: value => {
        actual = value;
      },
    },
  });
  assert.equal(
    actual,
    '/reference/classes/RenderWindow.html?from=bookmark#draw'
  );
  assert.ok(
    nodes.some(
      node =>
        node.tagName === 'a' &&
        node.attrs.some(
          attr =>
            attr.name === 'href' &&
            attr.value === '/reference/classes/RenderWindow.html'
        )
    )
  );
});

test('rejects unsafe paths and paths outside the ' +
     'legacy reference namespace', () => {
  for (const path of [
    '../index.html',
    'classes/../../index.html',
    '/classes/A.html',
    '//example.com/A.html',
    'classes/A.html?next=evil',
    'classes/A.html#draw',
    'classes/</script>.html',
    'index.html',
    'guide/index.html',
    'zh/index.html',
  ]) {
    assert.throws(() => redirectHtml(path), /Invalid legacy path/, path);
  }
});

test('generates aliases only for legacy reference ' +
     'pages without replacing site home or guides', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'sfml-redirects-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(join(dir, 'reference/classes'), { recursive: true });
  await mkdir(join(dir, 'reference/assets'), { recursive: true });
  await writeFile(join(dir, 'index.html'), 'SITE HOME');
  await writeFile(join(dir, 'reference/index.html'), 'API HOME');
  await writeFile(
    join(dir, 'reference/classes/RenderWindow.html'),
    'API CLASS'
  );
  await writeFile(join(dir, 'reference/hierarchy.html'), 'API HIERARCHY');
  await writeFile(join(dir, 'reference/assets/main.js'), '/* asset */');
  const routes = await generateRedirects(dir);
  assert.deepEqual(routes.sort(), [
    'classes/RenderWindow.html',
    'hierarchy.html',
  ]);
  assert.equal(await readFile(join(dir, 'index.html'), 'utf8'), 'SITE HOME');
  assert.match(
    await readFile(join(dir, 'classes/RenderWindow.html'), 'utf8'),
    /\/reference\/classes\/RenderWindow.html/
  );
  await assert.rejects(readFile(join(dir, 'assets/main.js')), {
    code: 'ENOENT',
  });
});
