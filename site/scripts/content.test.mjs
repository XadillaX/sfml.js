import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildManifest,
  createLinkMapper,
  locales,
  transformMarkdown,
} from './content.mjs';

const manifest = buildManifest();
const map = createLinkMapper(manifest, {
  isDirectory: path =>
    [ 'packages/sfml.js/src', 'packages/sfml.js/examples/ported' ].includes(
      path
    ),
  exists: path => !path.includes('missing'),
});

test(
  'publishes ImGui and interop in every language with package source links',
  () => {
    for (const locale of locales) {
      const source = `docs/imgui/api${locale.suffix}.md`;
      for (const route of [
        '/imgui/',
        '/imgui/getting-started',
        '/imgui/widgets',
        '/imgui/layout',
        '/imgui/fonts',
        '/imgui/callbacks',
        '/imgui/rendering',
        '/imgui/api',
        '/interop/',
      ]) {
        const page = manifest.find(
          item => item.route === locale.prefix + route
        );
        assert.ok(page, `Missing ${locale.prefix}${route}`);
        assert.ok(page.source.startsWith('docs/'));
      }
      assert.equal(
        map('/reference/imgui/', source),
        `${locale.prefix}/reference/imgui/`
      );
      assert.equal(
        map('../sfml/getting-started.md', source),
        `${locale.prefix}/guide/getting-started`
      );
      assert.equal(
        map('../../packages/sfml.js-imgui/src/index.ts', source),
        'https://github.com/XadillaX/node-sfml/blob/main/' +
        'packages/sfml.js-imgui/src/index.ts'
      );
    }
  });

test(
  'maps nested documentation and README links to ' +
    'the destination locale, preserving fragments',
  () => {
    const cases = [
      [
        'docs/sfml/api.md',
        'system.md#input-streams',
        '/guide/system#input-streams',
      ],
      [
        'docs/sfml/api.ko.md',
        'system.ko.md#input-streams',
        '/ko/guide/system#input-streams',
      ],
      [
        'docs/sfml/api.ja.md',
        'system.md#input-streams',
        '/ja/guide/system#input-streams',
      ],
      [
        'docs/sfml/api.md',
        'system.zh-CN.md?from=api#input-streams',
        '/zh/guide/system?from=api#input-streams',
      ],
      [
        'docs/sfml/getting-started.zh-CN.md',
        'README.zh-CN.md',
        '/zh/guide/',
      ],
      [
        'packages/sfml.js/examples/projects/README.ko.md',
        '../README.ko.md',
        '/ko/examples',
      ],
      [
        'docs/sfml/README.ja.md',
        '../../packages/sfml.js/examples/features/README.ja.md',
        '/ja/examples/features',
      ],
      [
        'docs/sfml/README.zh-CN.md',
        '../../packages/sfml.js/README.zh-CN.md',
        '/zh/',
      ],
      [ 'packages/sfml.js/examples/README.md', '../README.md', '/' ],
    ];
    for (const [ source, url, expected ] of cases) {
      assert.equal(map(url, source), expected, `${source}: ${url}`);
    }
  }
);

test(
  'maps project source files and folders to ' +
    'GitHub, never a broken local route',
  () => {
    assert.equal(
      map('../../packages/sfml.js/src/index.ts#L2', 'docs/sfml/api.md'),
      'https://github.com/XadillaX/node-sfml/blob/main/' +
      'packages/sfml.js/src/index.ts#L2'
    );
    assert.equal(
      map('../../packages/sfml.js/src/', 'docs/sfml/api.md'),
      'https://github.com/XadillaX/node-sfml/tree/main/packages/sfml.js/src'
    );
    assert.equal(
      map('sprites.cjs', 'packages/sfml.js/examples/README.ko.md'),
      'https://github.com/XadillaX/node-sfml/blob/main/' +
      'packages/sfml.js/examples/sprites.cjs'
    );
    assert.equal(
      map('../../packages/sfml.js/LICENSE', 'docs/sfml/api.md'),
      'https://github.com/XadillaX/node-sfml/blob/main/packages/sfml.js/LICENSE'
    );
    assert.equal(
      map(
        '../../packages/sfml.js/examples/ported/README.ja.md',
        'docs/sfml/README.ja.md'
      ),
      'https://github.com/XadillaX/node-sfml/blob/main/' +
        'packages/sfml.js/examples/ported/README.ja.md'
    );
    assert.equal(
      map('../../packages/sfml.js/examples/ported/', 'docs/sfml/README.md'),
      'https://github.com/XadillaX/node-sfml/tree/main/' +
      'packages/sfml.js/examples/ported'
    );
    assert.equal(
      map(
        'ported/render_window.cjs',
        'packages/sfml.js/examples/README.md'
      ),
      'https://github.com/XadillaX/node-sfml/blob/main/' +
        'packages/sfml.js/examples/ported/render_window.cjs'
    );
    assert.equal(
      map(
        'ported/assets/avatar.gif',
        'packages/sfml.js/examples/README.md'
      ),
      'https://github.com/XadillaX/node-sfml/blob/main/' +
        'packages/sfml.js/examples/ported/assets/avatar.gif'
    );
  }
);

test(
  'uses one shared media location for all ' +
    'locales and nested example images',
  () => {
    assert.equal(
      map(
        '../../packages/sfml.js/assets/render-texture.png',
        'docs/sfml/graphics.ja.md'
      ),
      '/media/render-texture.png'
    );
    assert.equal(
      map(
        '../../assets/examples/features/image.webp',
        'packages/sfml.js/examples/features/README.ja.md'
      ),
      '/media/examples/features/image.webp'
    );
  }
);

test('serves ImGui screenshot links from the site media directory', () => {
  for (const locale of locales) {
    assert.equal(
      map(
        'screenshots/demo.png',
        `packages/sfml.js-imgui/examples/README${locale.suffix}.md`
      ),
      '/media/imgui/examples/screenshots/demo.png'
    );
  }
});

test(
  'distinguishes old TypeDoc URLs from website ' +
    'routes and external links',
  () => {
    assert.equal(
      map('https://sfml.js.org/', 'docs/sfml/api.md'),
      '/reference/'
    );
    assert.equal(
      map(
        'https://sfml.js.org/classes/RenderWindow.html#draw',
        'docs/sfml/api.md'
      ),
      '/reference/classes/RenderWindow.html#draw'
    );
    assert.equal(
      map(
        'https://sfml.js.org/reference/classes/RenderWindow.html#draw',
        'docs/sfml/api.md'
      ),
      '/reference/classes/RenderWindow.html#draw'
    );
    assert.equal(
      map(
        'https://sfml.js.org/zh/guide/?from=home#intro',
        'docs/sfml/api.md'
      ),
      '/zh/guide/?from=home#intro'
    );
    for (const url of [
      '#draw-snapshots',
      '/zh/guide/',
      '/reference/',
      'https://www.sfml-dev.org/documentation/3.1.0/',
      'mailto:hello@example.com',
      '//example.com/docs',
      'https://example.com/file.md#anchor',
    ]) {
      assert.equal(map(url, 'docs/sfml/api.md'), url);
    }
  }
);

test(
  'keeps API links in the source document ' +
    'language, including old member URLs',
  () => {
    assert.equal(
      map('https://sfml.js.org/', 'docs/sfml/api.ja.md'),
      '/ja/reference/'
    );
    assert.equal(
      map(
        'https://sfml.js.org/classes/Clock.html#restart',
        'docs/sfml/system.ko.md'
      ),
      '/ko/reference/classes/Clock.html#restart'
    );
    assert.equal(
      map(
        '/reference/classes/Clock.html#restart',
        'docs/sfml/system.zh-CN.md'
      ),
      '/zh/reference/classes/Clock.html#restart'
    );
    assert.equal(
      map('https://sfml.js.org/reference/?q=time', 'docs/sfml/api.ja.md'),
      '/ja/reference/?q=time'
    );
  }
);

test('fails on missing relative targets and repository escapes', () => {
  assert.throws(
    () => map('missing.md', 'docs/sfml/api.md'),
    /Missing linked file/
  );
  assert.throws(
    () => map('../../../outside.md', 'docs/sfml/api.md'),
    /outside the repository/
  );
});

test(
  'transforms only link nodes, preserving code, ' +
    'stable anchors, tables and localized content',
  async () => {
    const markdown = [
      '# Graphics',
      '',
      '**English** · [简体中文](graphics.zh-CN.md) · ' +
        '[日本語](graphics.ja.md) · [한국어](graphics.ko.md)',
      '',
      '[Streams](system.md#input-streams) and [source][implementation].',
      '',
      '[implementation]: ../../packages/sfml.js/src/index.ts',
      '',
      '<a id="draw-snapshots"></a>',
      '',
      '![Scene](../../packages/sfml.js/assets/render-texture.png)',
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
    const output = await transformMarkdown(
      markdown,
      'docs/sfml/graphics.md',
      map
    );
    assert.match(output, /\[Streams\]\(\/guide\/system#input-streams\)/);
    assert.match(
      output,
      new RegExp(
        '\\[implementation\\]: https://github.com/' +
          'XadillaX/node-sfml/blob/main/packages/sfml.js/src/index.ts'
      )
    );
    assert.match(output, /<a id="draw-snapshots"><\/a>/);
    assert.match(output, /!\[Scene\]\(\/media\/render-texture.png\)/);
    assert.match(
      output,
      /\[Concepts\]\(\/guide\/concepts#draw-snapshots\)/
    );
    assert.match(
      output,
      /```markdown\n\[Leave code alone\]\(system.md\)\n```/
    );
    assert.match(output, /`\[Also code\]\(system.md\)`/);
    assert.doesNotMatch(output, /简体中文|graphics\.ja\.md/);
    assert.match(output, /\| API\s+\| Link/);
  }
);

test(
  'removes localized language bars without ' +
    'removing paragraphs that discuss languages',
  async () => {
    const output = await transformMarkdown(
      '# 문서\n\n[English](README.md) / ' +
        '[简体中文](README.zh-CN.md) / [日本語](README.ja.md) ' +
        '/ **한국어**\n\nUse English or 日本語 labels.\n',
      'docs/sfml/README.ko.md',
      map
    );
    assert.doesNotMatch(output, /README|简体中文/);
    assert.match(output, /Use English or 日本語 labels\./);
  }
);
