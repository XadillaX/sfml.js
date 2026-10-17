import { dirname, relative, resolve } from 'node:path';
import { cp } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Application, JSX, TSConfigReader, TypeDocReader } from 'typedoc';
import { registerSiteTheme } from './theme.mjs';
import { copyBranding } from '../branding.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const languages = [
  {
    id: 'en', label: 'English', guide: 'Guide', menu: 'Menu', language: 'Change language',
    examples: 'Examples', reference: 'API reference', search: 'Search',
    searchPlaceholder: 'Search the API', preparingSearch: 'Preparing search index…',
    light: 'Switch to light theme', dark: 'Switch to dark theme', contents: 'Contents', appearance: 'Appearance',
  },
  {
    id: 'zh', label: '简体中文', guide: '指南', menu: '菜单', language: '切换语言',
    examples: '示例', reference: 'API 参考', search: '搜索',
    searchPlaceholder: '搜索 API', preparingSearch: '正在准备搜索索引…',
    light: '切换到浅色模式', dark: '切换到深色模式', contents: '目录', appearance: '外观',
  },
  {
    id: 'ja', label: '日本語', guide: 'ガイド', menu: 'メニュー', language: '言語を変更',
    examples: 'サンプル', reference: 'API リファレンス', search: '検索',
    searchPlaceholder: 'API を検索', preparingSearch: '検索インデックスを準備中…',
    light: 'ライトテーマに切り替える', dark: 'ダークテーマに切り替える', contents: '目次', appearance: 'テーマ',
  },
  {
    id: 'ko', label: '한국어', guide: '가이드', menu: '메뉴', language: '언어 변경',
    examples: '예제', reference: 'API 레퍼런스', search: '검색',
    searchPlaceholder: 'API 검색', preparingSearch: '검색 색인 준비 중…',
    light: '밝은 테마로 전환', dark: '어두운 테마로 전환', contents: '목차', appearance: '테마',
  },
];

/** Generate one complete reference tree per language from the same sources. */
export async function buildReferences(out, { site = false } = {}) {
  const destination = locale => resolve(out,
    locale.id === 'en' ? '' : locale.id, site ? 'reference' : '');
  for (const locale of languages) {
    const prefix = locale.id === 'en' ? '' : `/${locale.id}`;
    const app = await Application.bootstrapWithPlugins({
      options: resolve(root, 'typedoc.json'),
      tsconfig: resolve(root, 'tsconfig.json'),
      entryPoints: [ resolve(root, 'src/index.ts') ],
      out: destination(locale),
      lang: locale.id,
      favicon: resolve(root, 'assets/branding/sfml-js-symbol-pentagon.svg'),
      customCss: resolve(root, 'site/.vitepress/theme/reference.css'),
      customJs: resolve(root, 'tools/typedoc/navigation.js'),
      titleLink: site ? `${prefix}/` : undefined,
      navigationLinks: {},
    }, [ new TypeDocReader(), new TSConfigReader() ]);

    registerSiteTheme(app, {
      locale, languages, home: site ? `${prefix}/` : `https://sfml.js.org${prefix}/`,
      localeHref: (target, page) => relative(
        dirname(resolve(destination(locale), page)),
        resolve(destination(target), page),
      ).replaceAll('\\', '/'),
    });
    // Set TypeDoc's key before its first-paint script and settings initializer run.
    app.renderer.hooks.on('body.begin', () => JSX.createElement('script', null,
      JSX.createElement(JSX.Raw, { html: `try {
        const preference = localStorage.getItem('vitepress-theme-appearance') || localStorage.getItem('tsd-theme') || 'auto';
        const mode = preference === 'dark' || preference === 'light' ? preference : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        localStorage.setItem('vitepress-theme-appearance', preference === 'os' ? 'auto' : preference);
        localStorage.setItem('tsd-theme', mode);
        document.documentElement.dataset.theme = mode;
      } catch {}` })));

    const project = await app.convert();
    if (!project) throw new Error('TypeDoc could not convert the project');
    app.validate(project);
    await app.generateDocs(project, destination(locale));
    if (app.logger.hasErrors()) throw new Error('TypeDoc reported errors');
    const assets = resolve(destination(locale), 'assets');
    await cp(resolve(root, 'site/.vitepress/theme/tokens.css'), resolve(assets, 'tokens.css'));
    await cp(resolve(root, 'site/.vitepress/theme/fonts'), resolve(assets, 'fonts'), { recursive: true });
    await cp(resolve(root, 'assets/icons/game-icons'), resolve(assets, 'game-icons'), { recursive: true });
    await copyBranding(assets);
  }
}

if (process.argv[1] &&
    import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await buildReferences(resolve(root, 'build/docs'));
}
