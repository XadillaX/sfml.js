import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type DefaultTheme } from 'vitepress';
import { buildManifest, locales, repository } from '../scripts/content.mjs';

const configDir = fileURLToPath(new URL('.', import.meta.url));
const siteRoot = resolve(configDir, '..');
const projectRoot = resolve(siteRoot, '..');
const manifest = buildManifest();

const ui = {
  root: {
    guide: 'Guide', modules: 'Modules', examples: 'Examples', reference: 'API reference',
    learn: 'Learn', resources: 'Resources', onPage: 'On this page', previous: 'Previous page',
    next: 'Next page', edit: 'Edit this page on GitHub', menu: 'Menu', top: 'Return to top',
    appearance: 'Appearance', light: 'Switch to light theme', dark: 'Switch to dark theme',
    language: 'Change language', search: 'Search', searchLabel: 'Search documentation',
    noResults: 'No results for', reset: 'Reset search', close: 'Close search',
    select: 'to select', navigate: 'to navigate', footerClose: 'to close',
  },
  zh: {
    guide: '指南', modules: '模块', examples: '示例', reference: 'API 参考',
    learn: '开始使用', resources: '资源', onPage: '本页目录', previous: '上一页',
    next: '下一页', edit: '在 GitHub 上编辑此页', menu: '菜单', top: '返回顶部',
    appearance: '外观', light: '切换到浅色模式', dark: '切换到深色模式',
    language: '切换语言', search: '搜索', searchLabel: '搜索文档',
    noResults: '未找到结果', reset: '清除搜索', close: '关闭搜索',
    select: '选择', navigate: '切换', footerClose: '关闭',
  },
  ja: {
    guide: 'ガイド', modules: 'モジュール', examples: 'サンプル', reference: 'API リファレンス',
    learn: 'はじめに', resources: 'リソース', onPage: 'このページの内容', previous: '前のページ',
    next: '次のページ', edit: 'GitHub でこのページを編集', menu: 'メニュー', top: 'トップに戻る',
    appearance: 'テーマ', light: 'ライトテーマに切り替える', dark: 'ダークテーマに切り替える',
    language: '言語を変更', search: '検索', searchLabel: 'ドキュメントを検索',
    noResults: '検索結果がありません', reset: '検索をリセット', close: '検索を閉じる',
    select: '選択', navigate: '移動', footerClose: '閉じる',
  },
  ko: {
    guide: '가이드', modules: '모듈', examples: '예제', reference: 'API 레퍼런스',
    learn: '시작하기', resources: '리소스', onPage: '이 페이지의 내용', previous: '이전 페이지',
    next: '다음 페이지', edit: 'GitHub에서 이 페이지 편집', menu: '메뉴', top: '맨 위로',
    appearance: '테마', light: '밝은 테마로 전환', dark: '어두운 테마로 전환',
    language: '언어 변경', search: '검색', searchLabel: '문서 검색',
    noResults: '검색 결과 없음', reset: '검색 초기화', close: '검색 닫기',
    select: '선택', navigate: '이동', footerClose: '닫기',
  },
};

function localizedTheme(locale: typeof locales[number]): DefaultTheme.Config {
  const text = ui[locale.id as keyof typeof ui];
  const pages = manifest.filter(page => page.locale.id === locale.id && !page.home);
  const items = new Map(pages.map(page => [ page.route, {
    text: readFileSync(resolve(projectRoot, page.source), 'utf8').match(/^# (.+)$/m)?.[1] || page.route,
    link: page.route,
  } ]));
  const sectionItems = (routes: string[]): DefaultTheme.SidebarItem[] =>
    routes.map(route => {
      const item = items.get(locale.prefix + route);
      if (!item) {
        throw new Error(`Missing sidebar page: ${locale.prefix}${route}`);
      }
      return item;
    });
  return {
    nav: [
      { text: text.guide, link: `${locale.prefix}/guide/getting-started`, activeMatch: '/guide/' },
      { text: text.examples, link: `${locale.prefix}/examples`, activeMatch: '/examples' },
      { text: text.reference, link: `${locale.prefix}/reference/`, target: '_self' },
    ],
    sidebar: [
      {
        text: text.learn,
        items: sectionItems([
          '/guide/', '/guide/getting-started', '/guide/concepts', '/guide/api',
        ]),
      },
      {
        text: text.modules,
        items: sectionItems([
          '/guide/system', '/guide/window', '/guide/graphics',
          '/guide/audio', '/guide/network',
        ]),
      },
      {
        text: text.examples,
        items: sectionItems([
          '/examples', '/examples/features',
          '/examples/official', '/examples/projects',
        ]),
      },
      {
        text: text.resources,
        items: [
          ...sectionItems([ '/guide/development' ]),
          { text: text.reference, link: `${locale.prefix}/reference/`, target: '_self' },
        ],
      },
    ],
    outline: { label: text.onPage, level: [ 2, 3 ] },
    docFooter: { prev: text.previous, next: text.next },
    editLink: {
      pattern: page => `https://github.com/XadillaX/node-sfml/edit/main/${page.frontmatter.sourcePath}`,
      text: text.edit,
    },
    sidebarMenuLabel: text.menu,
    returnToTopLabel: text.top,
    darkModeSwitchLabel: text.appearance,
    lightModeSwitchTitle: text.light,
    darkModeSwitchTitle: text.dark,
    langMenuLabel: text.language,
  };
}

export default defineConfig({
  title: 'sfml.js',
  description: locales[0].description,
  srcDir: resolve(configDir, '../../build/site-source'),
  outDir: resolve(configDir, '../../build/site'),
  cacheDir: resolve(siteRoot, '.vitepress/cache'),
  cleanUrls: true,
  // TypeDoc runs after VitePress; scripts/check.mjs validates these generated targets.
  ignoreDeadLinks: [ /^\/(?:(?:zh|ja|ko)\/)?reference(?:\/|$)/ ],
  lastUpdated: false,
  sitemap: { hostname: 'https://sfml.js.org' },
  vite: {
    resolve: {
      // Prepared Markdown sits outside site/, so resolve Vue from the isolated package.
      alias: [
        { find: 'vue/server-renderer', replacement: resolve(siteRoot, 'node_modules/@vue/server-renderer/dist/server-renderer.esm-bundler.js') },
        { find: /^vue$/, replacement: resolve(siteRoot, 'node_modules/vue/dist/vue.runtime.esm-bundler.js') },
      ],
    },
  },
  markdown: {
    config(md) {
      const renderLink = md.renderer.rules.link_open || ((tokens, index, options, _env, self) => self.renderToken(tokens, index, options));
      md.renderer.rules.link_open = (tokens, index, options, env, self) => {
        if (/^\/(?:(?:zh|ja|ko)\/)?reference\//.test(tokens[index].attrGet('href') || '')) {
          tokens[index].attrSet('target', '_self');
        }
        return renderLink(tokens, index, options, env, self);
      };
    },
  },
  head: [
    [ 'link', { rel: 'icon', type: 'image/svg+xml', href: '/media/sfml-js-symbol-pentagon.svg' } ],
    [ 'meta', { name: 'theme-color', content: '#182d24' } ],
  ],
  locales: Object.fromEntries(locales.map(locale => [ locale.id, {
    label: locale.label,
    lang: locale.lang,
    link: `${locale.prefix}/`,
    title: 'sfml.js',
    description: locale.description,
    themeConfig: localizedTheme(locale),
  } ])),
  themeConfig: {
    logo: { src: '/media/sfml-js-symbol-pentagon.svg', alt: '' },
    siteTitle: false,
    i18nRouting: true,
    socialLinks: [ { icon: 'github', link: repository } ],
    search: {
      provider: 'local',
      options: {
        locales: Object.fromEntries(locales.map(locale => {
          const text = ui[locale.id as keyof typeof ui];
          return [ locale.id, { translations: {
            button: { buttonText: text.search, buttonAriaLabel: text.searchLabel },
            modal: {
              displayDetails: text.searchLabel,
              resetButtonTitle: text.reset,
              backButtonTitle: text.close,
              noResultsText: text.noResults,
              footer: { selectText: text.select, navigateText: text.navigate, closeText: text.footerClose },
            },
          } } ];
        })),
      },
    },
  },
});
