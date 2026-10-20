import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildManifest,
  createLinkMapper,
  transformMarkdown,
} from './content.mjs';

const manifest = buildManifest();
const map = createLinkMapper(manifest, {
  isDirectory: path => [ 'src', 'examples/ported' ].includes(path),
  exists: path => !path.includes('missing'),
});

test('maps nested documentation and README links to ' +
     'the destination locale, preserving fragments', () => {
  const cases = [
    [ 'docs/api.md', 'system.md#input-streams', '/guide/system#input-streams' ],
    [
      'docs/api.ko.md',
      'system.ko.md#input-streams',
      '/ko/guide/system#input-streams',
    ],
    [
      'docs/api.ja.md',
      'system.md#input-streams',
      '/ja/guide/system#input-streams',
    ],
    [
      'docs/api.md',
      'system.zh-CN.md?from=api#input-streams',
      '/zh/guide/system?from=api#input-streams',
    ],
    [ 'docs/getting-started.zh-CN.md', 'README.zh-CN.md', '/zh/guide/' ],
    [ 'examples/ported/README.ko.md', '../README.ko.md', '/ko/examples' ],
    [
      'docs/README.ja.md',
      '../examples/ported/README.ja.md',
      '/ja/examples/ported',
    ],
    [ 'docs/README.zh-CN.md', '../README.zh-CN.md', '/zh/' ],
    [ 'examples/README.md', '../README.md', '/' ],
  ];
  for (const [ source, url, expected ] of cases) {
    assert.equal(map(url, source), expected, `${source}: ${url}`);
  }
});

test('maps project source files and folders to ' +
     'GitHub, never a broken local route', () => {
  assert.equal(map('../src/index.ts#L2', 'docs/api.md'),
    'https://github.com/XadillaX/node-sfml/blob/main/src/index.ts#L2');
  assert.equal(map('../src/', 'docs/api.md'),
    'https://github.com/XadillaX/node-sfml/tree/main/src');
  assert.equal(map('sprites.cjs', 'examples/README.ko.md'),
    'https://github.com/XadillaX/node-sfml/blob/main/examples/sprites.cjs');
  assert.equal(map('../LICENSE', 'docs/api.md'),
    'https://github.com/XadillaX/node-sfml/blob/main/LICENSE');
});

test('uses one shared media location for all ' +
     'locales and nested example images', () => {
  assert.equal(
    map('../assets/render-texture.png', 'docs/graphics.ja.md'),
    '/media/render-texture.png'
  );
  assert.equal(
    map('assets/avatar.gif', 'examples/ported/README.md'),
    '/media/examples/ported/assets/avatar.gif'
  );
});

test('distinguishes old TypeDoc URLs from website ' +
     'routes and external links', () => {
  assert.equal(map('https://sfml.js.org/', 'docs/api.md'), '/reference/');
  assert.equal(
    map(
      'https://sfml.js.org/classes/RenderWindow.html#draw',
      'docs/api.md'
    ),
    '/reference/classes/RenderWindow.html#draw'
  );
  assert.equal(
    map(
      'https://sfml.js.org/reference/classes/RenderWindow.html#draw',
      'docs/api.md'
    ),
    '/reference/classes/RenderWindow.html#draw'
  );
  assert.equal(
    map(
      'https://sfml.js.org/zh/guide/?from=home#intro',
      'docs/api.md'
    ),
    '/zh/guide/?from=home#intro'
  );
  for (const url of [
    '#draw-snapshots', '/zh/guide/', '/reference/',
    'https://www.sfml-dev.org/documentation/3.1.0/', 'mailto:hello@example.com',
    '//example.com/docs', 'https://example.com/file.md#anchor',
  ]) {
    assert.equal(map(url, 'docs/api.md'), url);
  }
});

test('keeps API links in the source document ' +
     'language, including old member URLs', () => {
  assert.equal(map('https://sfml.js.org/', 'docs/api.ja.md'), '/ja/reference/');
  assert.equal(
    map(
      'https://sfml.js.org/classes/Clock.html#restart',
      'docs/system.ko.md'
    ),
    '/ko/reference/classes/Clock.html#restart'
  );
  assert.equal(
    map(
      '/reference/classes/Clock.html#restart',
      'docs/system.zh-CN.md'
    ),
    '/zh/reference/classes/Clock.html#restart'
  );
  assert.equal(map('https://sfml.js.org/reference/?q=time', 'docs/api.ja.md'),
    '/ja/reference/?q=time');
});

test('fails on missing relative targets and repository escapes', () => {
  assert.throws(() => map('missing.md', 'docs/api.md'), /Missing linked file/);
  assert.throws(
    () => map('../../outside.md', 'docs/api.md'),
    /outside the repository/
  );
});

test('transforms only link nodes, preserving code, ' +
     'stable anchors, tables and localized content', async () => {
  const markdown = [
    '# Graphics',
    '',
    '**English** · [简体中文](graphics.zh-CN.md) · ' +
    '[日本語](graphics.ja.md) · [한국어](graphics.ko.md)',
    '',
    '[Streams](system.md#input-streams) and [source][implementation].',
    '',
    '[implementation]: ../src/index.ts',
    '',
    '<a id="draw-snapshots"></a>',
    '',
    '![Scene](../assets/render-texture.png)',
    '',
    '| API | Link |',
    '| --- | --- |',
    '| Draw | [Concepts](concepts.md#draw-snapshots) |',
    '',
    '```markdown',
    '[Leave code alone](system.md)',
    '```',
    '',
    '`[Also code](system.md)`',
    '',
  ].join('\n');
  const output = await transformMarkdown(markdown, 'docs/graphics.md', map);
  assert.match(output, /\[Streams\]\(\/guide\/system#input-streams\)/);
  assert.match(
    output,
    new RegExp('\\[implementation\\]: https://github.com/' +
      'XadillaX/node-sfml/blob/main/src/index.ts')
  );
  assert.match(output, /<a id="draw-snapshots"><\/a>/);
  assert.match(output, /!\[Scene\]\(\/media\/render-texture.png\)/);
  assert.match(output, /\[Concepts\]\(\/guide\/concepts#draw-snapshots\)/);
  assert.match(output, /```markdown\n\[Leave code alone\]\(system.md\)\n```/);
  assert.match(output, /`\[Also code\]\(system.md\)`/);
  assert.doesNotMatch(output, /简体中文|graphics\.ja\.md/);
  assert.match(output, /\| API\s+\| Link/);
});

test('removes localized language bars without ' +
     'removing paragraphs that discuss languages', async () => {
  const output = await transformMarkdown(
    '# 문서\n\n[English](README.md) / ' +
    '[简体中文](README.zh-CN.md) / [日本語](README.ja.md) ' +
    '/ **한국어**\n\nUse English or 日本語 labels.\n',
    'docs/README.ko.md',
    map
  );
  assert.doesNotMatch(output, /README|简体中文/);
  assert.match(output, /Use English or 日本語 labels\./);
});
