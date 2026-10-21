import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test, { after, before } from 'node:test';
import { parse } from 'parse5';
import { createServer } from 'vite';
import vue from '@vitejs/plugin-vue';
import { createMarkdownRenderer } from 'vitepress';
import { createSSRApp, h, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import {
  buildManifest,
  createLinkMapper,
  locales,
  rootDir,
  transformMarkdown,
} from './content.mjs';

const siteDir = resolve(rootDir, 'site');
const manifest = buildManifest();
const map = createLinkMapper(manifest);
const exampleRoutes = [
  '/examples',
  '/examples/features',
  '/examples/official',
  '/examples/projects',
];
const groupLabels = {
  root: [ 'Learn', 'Modules', 'Examples', 'Resources' ],
  zh: [ '开始使用', '模块', '示例', '资源' ],
  ja: [ 'はじめに', 'モジュール', 'サンプル', 'リソース' ],
  ko: [ '시작하기', '모듈', '예제', '리소스' ],
};
const attr = (node, name) =>
  node.attrs?.find(item => item.name === name)?.value;
const hasClass = (node, name) =>
  attr(node, 'class')?.split(/\s+/).includes(name);
const elements = (node, predicate) => [
  ...(predicate(node) ? [ node ] : []),
  ...(node.childNodes || []).flatMap(child => elements(child, predicate)),
];
const textContent = node => (node.nodeName === '#text' ? node.value
  : (node.childNodes || []).map(textContent).join(''));

let server;
let config;
let Home;
let theme;
let pages;

function createSlotApp() {
  // Render our slot content, leaving the upstream layout to VitePress.
  return createSSRApp({
    setup() {
      const render = theme.Layout.setup();
      return () => {
        const slots = render().children;
        return h('div', [
          slots['home-hero-before'](),
          slots['layout-bottom'](),
        ]);
      };
    },
  });
}

before(async () => {
  // Compile real site modules in memory, without a build or disk cache.
  server = await createServer({
    root: siteDir,
    configFile: false,
    logLevel: 'error',
    server: { middlewareMode: true, watch: null, hmr: false },
    optimizeDeps: { noDiscovery: true, include: [] },
    plugins: [
      vue(),
      {
        name: 'homepage-test-context',
        enforce: 'pre',
        transform(code, id) {
          if (id.endsWith('/Home.vue') ||
            id.endsWith('/theme/index.ts')) {
            return code.replaceAll("from 'vitepress'",
              "from 'virtual:homepage-test-context'")
              .replace("from 'vitepress/theme'",
                "from 'virtual:homepage-test-context'");
          }
        },
        resolveId(id) {
          if (id === 'virtual:homepage-test-context') {
            return '\0homepage-test-context';
          }
        },
        load(id) {
          if (id === '\0homepage-test-context') {
            // Supply page context and a layout placeholder; test real slots.
            return "import { inject } from 'vue';" +
              "export const useData = () => inject('homepage-test-data');" +
              'export const withBase = path => path;' +
              'export default { Layout: {} };';
          }
        },
      },
    ],
  });
  config = (await server.ssrLoadModule('/.vitepress/config.mts')).default;
  Home = (await server.ssrLoadModule('/.vitepress/theme/Home.vue')).default;
  theme = (await server.ssrLoadModule('/.vitepress/theme/index.ts')).default;
  const renderer = await createMarkdownRenderer(rootDir);
  pages = new Map();
  for (const page of manifest.filter(page => !page.home)) {
    const source = await readFile(resolve(rootDir, page.source), 'utf8');
    const markdown = await transformMarkdown(source, page.source, map);
    pages.set(page.route, parse(renderer.render(markdown, {
      cleanUrls: config.cleanUrls,
    })));
  }
});

after(async () => {
  await server?.close();
});

locales.forEach(locale => {
  test(`publishes the four example sections: ${locale.lang}`, () => {
    const routes = manifest.filter(page =>
      page.locale.id === locale.id &&
      page.route.startsWith(`${locale.prefix}/examples`)
    );
    assert.deepEqual(routes.map(page => page.route),
      exampleRoutes.map(route => locale.prefix + route));
    for (const page of routes) {
      assert.ok(existsSync(resolve(rootDir, page.source)), page.source);
    }
    const overview = pages.get(`${locale.prefix}/examples`);
    const picks = elements(overview, node => hasClass(node, 'example-pick'));
    assert.deepEqual(picks.map(node => attr(node, 'href')), [
      'super-mario-kart', 'play-nes',
    ].map(anchor => `${locale.prefix}/examples/projects#${anchor}`));
    for (const pick of picks) {
      assert.equal(elements(pick, node => node.tagName === 'a').length, 1);
      assert.equal(elements(pick, node => node.tagName === 'img').length, 1);
    }
    const topics = elements(overview, node =>
      hasClass(node, 'example-topics'))[0];
    assert.equal(elements(topics, node => node.tagName === 'dt').length, 3);
  });

  test(`sidebar groups preserve reading order: ${locale.lang}`, () => {
    const theme = config.locales[locale.id].themeConfig;
    assert.deepEqual(theme.sidebar.map(group => group.text),
      groupLabels[locale.id]);
    const expectedGroups = [
      [ '/guide/', '/guide/getting-started', '/guide/concepts', '/guide/api' ],
      [
        '/guide/system', '/guide/window', '/guide/graphics',
        '/guide/audio', '/guide/network',
      ],
      exampleRoutes,
      [ '/guide/development', '/reference/' ],
    ];
    for (const [ index, routes ] of expectedGroups.entries()) {
      assert.deepEqual(theme.sidebar[index].items.map(item => item.link),
        routes.map(route => locale.prefix + route));
    }
    assert.equal(theme.nav[1].link, `${locale.prefix}/examples`);
  });

  test(`project guides retain readable instructions: ${locale.lang}`, () => {
    const page = pages.get(`${locale.prefix}/examples/projects`);
    const guides = elements(page, node => hasClass(node, 'project-feature'));
    assert.equal(guides.length, 2);
    for (const [ index, guide ] of guides.entries()) {
      const run = elements(guide, node => hasClass(node, 'project-run'));
      const controls = elements(guide, node =>
        hasClass(node, 'project-controls'));
      const notes = elements(guide, node => node.tagName === 'details');
      assert.equal(run.length, 1);
      assert.equal(controls.length, 1);
      assert.equal(notes.length, 1);
      assert.equal(attr(notes[0], 'open'), undefined);
      assert.ok(elements(notes[0], node => node.tagName === 'summary').length);
      assert.ok(elements(controls[0], node => node.tagName === 'kbd').length);
      const commands = elements(run[0], node => node.tagName === 'pre');
      assert.equal(commands.length, index === 0 ? 1 : 2);
      assert.ok(textContent(commands[0]).includes(
        index === 0 ? 'npm start' : 'nes croom'));
      for (const command of commands) {
        assert.doesNotMatch(textContent(command), /<\/?(section|details|div)/);
      }
    }
  });

  test(`homepage previews lead to run instructions: ${locale.lang}`,
    async () => {
      const app = createSSRApp(Home);
      app.provide('homepage-test-data', { lang: ref(locale.lang) });
      const home = parse(await renderToString(app));
      const previews = elements(home, node => hasClass(node, 'example-image'));
      const destinations = [
        '/examples/projects#breakout',
        '/examples/features#render-texture',
      ];
      assert.deepEqual(previews.map(node => attr(node, 'href')),
        destinations.map(route => locale.prefix + route));
      const links = elements(home, node => node.tagName === 'a')
        .map(node => attr(node, 'href'));
      const projectLinks = elements(home, node =>
        hasClass(node, 'project-entry-links')
      ).map(node => elements(node, child => child.tagName === 'a')[0]);
      assert.deepEqual(projectLinks.map(node => attr(node, 'href')), [
        'super-mario-kart', 'play-nes', 'node-sfml-demos', '16-games',
      ].map(anchor => `${locale.prefix}/examples/projects#${anchor}`));
      for (const source of [
        'node-sfml/blob/main/examples/breakout.cjs',
        'node-sfml/blob/main/examples/render-texture.cjs',
        'super-mario-kart-sfml.js',
        'node-sfml-demos',
        '16-sfml.js-games-ported',
        'play-nes',
      ]) {
        assert.ok(links.includes(`https://github.com/XadillaX/${source}`),
          `missing independent source: ${source}`);
      }
      for (const destination of [
        ...destinations,
        '/examples/projects#super-mario-kart',
        '/examples/projects#node-sfml-demos',
        '/examples/projects#16-games',
        '/examples/projects#play-nes',
      ]) {
        const [ route, anchor ] = destination.split('#');
        const target = pages.get(locale.prefix + route);
        assert.ok(target, `missing page: ${route}`);
        assert.ok(elements(target, node => attr(node, 'id') === anchor).length,
          `missing instructions anchor: ${destination}`);
      }
      for (const preview of previews) {
        assert.ok(attr(preview, 'aria-label'));
        assert.ok(elements(preview, node => node.tagName === 'img')
          .every(node => attr(node, 'alt')));
      }
    });

  test(`footer credits appear once on home and guides: ${locale.lang}`,
    async () => {
      for (const isHome of [ true, false ]) {
        const app = createSlotApp();
        app.provide('homepage-test-data', {
          lang: ref(locale.lang),
          frontmatter: ref({ sfmlHome: isHome }),
        });
        const page = parse(await renderToString(app));
        const credits = elements(page, node =>
          hasClass(node, 'sf-icon-credits'));
        assert.equal(credits.length, 1, `home=${isHome}`);
        for (const name of [ 'Lorc', 'Delapouite', 'Skoll', 'CC BY 3.0' ]) {
          assert.ok(textContent(credits[0]).includes(name), name);
        }
        const creditLinks = elements(credits[0], node => node.tagName === 'a')
          .map(node => attr(node, 'href'));
        assert.deepEqual(creditLinks, [
          'https://lorcblog.blogspot.com/',
          'https://delapouite.com/',
          'https://game-icons.net/',
          'https://creativecommons.org/licenses/by/3.0/',
        ]);
        if (isHome) {
          const footer = elements(page, node =>
            node.tagName === 'footer')[0];
          assert.ok(footer, 'homepage footer');
          assert.equal(elements(footer, node =>
            hasClass(node, 'sf-icon-credits')).length, 1);
          assert.ok(textContent(footer).includes('MIT'));
          const footerLinks = elements(footer, node => node.tagName === 'a')
            .map(node => attr(node, 'href'));
          assert.ok(footerLinks.includes(`${locale.prefix}/`));
        } else {
          assert.equal(elements(page, node =>
            hasClass(node, 'sfml-home')).length, 0);
        }
      }
    });
});

test('generated documentation links resolve without legacy site routes',
  () => {
    for (const [ route, page ] of pages) {
      const links = elements(page, node => node.attrs?.some(item =>
        [ 'href', 'src' ].includes(item.name)
      )).flatMap(node => node.attrs.filter(item =>
        [ 'href', 'src' ].includes(item.name)
      ).map(item => item.value));
      for (const link of links) {
        const url = new URL(link, `https://sfml.js.org${route}`);
        if (url.origin !== 'https://sfml.js.org') {
          continue;
        }
        assert.doesNotMatch(url.pathname,
          /^\/(?:(?:zh|ja|ko)\/)?examples\/ported(?:\/|$)/);
        if (url.pathname.startsWith('/media/')) {
          const path = url.pathname.slice('/media/'.length);
          const source = path.startsWith('examples/official/screenshots/')
            ? path : `assets/${path}`;
          assert.ok(existsSync(resolve(rootDir, source)),
            `${route}: missing image ${link}`);
          continue;
        }
        if (/^\/(?:(?:zh|ja|ko)\/)?reference\//.test(url.pathname)) {
          continue; // TypeDoc generation is verified by the full site build.
        }
        const target = pages.get(url.pathname);
        assert.ok(target || manifest.some(item => item.route === url.pathname),
          `${route}: missing route ${link}`);
        if (target && url.hash) {
          const anchor = decodeURIComponent(url.hash.slice(1));
          const matches = elements(target, node => attr(node, 'id') === anchor);
          assert.ok(matches.length,
            `${route}: missing anchor ${link}`);
        }
      }
    }
  });

test('rendered galleries preserve entries and preview links', () => {
  for (const locale of locales) {
    for (const [ section, count ] of [
      [ 'features', 15 ], [ 'official', 24 ], [ 'projects', 24 ],
    ]) {
      const page = pages.get(`${locale.prefix}/examples/${section}`);
      assert.ok(page, `missing ${section} gallery in ${locale.lang}`);
      const entries = elements(page, node => hasClass(node, 'example-entry'));
      assert.equal(entries.length, count, `${locale.lang}/${section}`);
      if (section === 'projects') {
        assert.deepEqual(entries.slice(0, 3).map(node => attr(node, 'id')),
          [ 'super-mario-kart-game', 'play-nes-player', 'breakout-game' ]);
      }
      for (const entry of entries) {
        assert.ok(attr(entry, 'id'));
        assert.equal(elements(entry, node =>
          hasClass(node, 'example-info')
        ).length, 1);
        for (const image of elements(entry, node => node.tagName === 'img')) {
          assert.equal(attr(image.parentNode, 'href'), attr(image, 'src'),
            `${attr(entry, 'id')}: preview must open its full image`);
          assert.ok(attr(image, 'alt'));
        }
      }
    }
  }
});
