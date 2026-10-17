import { existsSync, statSync } from 'node:fs';
import { posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { visit } from 'unist-util-visit';
import { parseFragment, serialize } from 'parse5';

export const rootDir = fileURLToPath(new URL('../../', import.meta.url));
export const sourceDir = resolve(rootDir, 'build/site-source');
export const outputDir = resolve(rootDir, 'build/site');
export const repository = 'https://github.com/XadillaX/node-sfml';

export const locales = [
  { id: 'root', lang: 'en', suffix: '', prefix: '', label: 'English',
    title: 'SFML for Node.js',
    description: 'The Node.js binding for SFML. Create native windows, draw 2D graphics and play audio in JavaScript or TypeScript.' },
  { id: 'zh', lang: 'zh-CN', suffix: '.zh-CN', prefix: '/zh', label: '简体中文',
    title: 'SFML 的 Node.js 绑定',
    description: 'SFML 的 Node.js 绑定。用 JavaScript 或 TypeScript 创建原生窗口、绘制二维图形、播放音频。' },
  { id: 'ja', lang: 'ja', suffix: '.ja', prefix: '/ja', label: '日本語',
    title: 'SFML の Node.js バインディング',
    description: 'SFML の Node.js バインディング。JavaScript や TypeScript でネイティブウィンドウを開き、2D グラフィックスを描画し、音声を再生できます。' },
  { id: 'ko', lang: 'ko', suffix: '.ko', prefix: '/ko', label: '한국어',
    title: 'SFML의 Node.js 바인딩',
    description: 'SFML의 Node.js 바인딩입니다. JavaScript나 TypeScript로 네이티브 창을 만들고, 2D 그래픽을 그리고, 오디오를 재생하세요.' },
];

const documentGroups = [
  [ 'docs/README', '/guide/' ],
  ...[ 'getting-started', 'concepts', 'api', 'system', 'window', 'graphics', 'audio', 'network', 'development' ]
    .map(name => [ `docs/${name}`, `/guide/${name}` ]),
  [ 'examples/README', '/examples' ],
  [ 'examples/ported/README', '/examples/ported' ],
];

export function buildManifest() {
  return locales.flatMap(locale => [
    { source: `README${locale.suffix}.md`, route: `${locale.prefix}/`, locale, home: true },
    ...documentGroups.map(([ stem, route ]) => ({
      source: `${stem}${locale.suffix}.md`, route: locale.prefix + route, locale, home: false,
    })),
  ]);
}

export const legacyDirectories = [
  'classes', 'interfaces', 'enums', 'functions', 'types', 'variables', 'modules', 'documents',
];
export const legacyRootFiles = [ 'modules.html', 'hierarchy.html' ];

export function createLinkMapper(manifest, {
  exists = path => existsSync(resolve(rootDir, path)),
  isDirectory = path => exists(path) && statSync(resolve(rootDir, path)).isDirectory(),
} = {}) {
  const pages = new Map(manifest.map(page => [ page.source, page ]));
  return (url, source) => {
    const locale = pages.get(source)?.locale;
    const prefix = locale?.prefix || '';
    if (/^\/reference(?:\/|[?#]|$)/.test(url)) return prefix + url;
    if (/^https?:\/\/sfml\.js\.org(?:\/|$)/i.test(url)) {
      const parsed = new URL(url);
      if (parsed.pathname === '/' || parsed.pathname === '/index.html') {
        return `${prefix}/reference/${parsed.search}${parsed.hash}`;
      }
      const first = parsed.pathname.split('/')[1];
      if (legacyDirectories.includes(first) || legacyRootFiles.includes(first)) {
        return `${prefix}/reference${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
      if (first === 'reference') {
        return `${prefix}${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    if (/^(?:[a-z][a-z\d+.-]*:|\/|#|\?)/i.test(url) || !url) return url;

    const boundary = url.search(/[?#]/);
    const pathname = boundary < 0 ? url : url.slice(0, boundary);
    const suffix = boundary < 0 ? '' : url.slice(boundary);
    const target = posix.normalize(posix.join(posix.dirname(source), decodeURIComponent(pathname))).replace(/\/$/, '');
    if (target === '..' || target.startsWith('../')) {
      throw new Error(`Link points outside the repository: ${source} -> ${url}`);
    }
    if (!exists(target)) throw new Error(`Missing linked file: ${source} -> ${url}`);

    let page = pages.get(target);
    // Unsuffixed links in a translation stay in that language when a translation exists.
    if (page && locale?.suffix && !page.locale.suffix) {
      page = pages.get(target.replace(/\.md$/, `${locale.suffix}.md`)) || page;
    }
    if (page) return page.route + suffix;
    if (target.startsWith('assets/')) return `/media/${target.slice(7)}${suffix}`;
    if (target.startsWith('examples/ported/assets/')) return `/media/${target}${suffix}`;
    const kind = isDirectory(target) ? 'tree' : 'blob';
    const encoded = target.replace(/\/$/, '').split('/').map(encodeURIComponent).join('/');
    return `${repository}/${kind}/main/${encoded}${suffix}`;
  };
}

function textContent(node) {
  return node.value || (node.children || []).map(textContent).join('');
}

function rewriteHtml(value, source, map) {
  const fragment = parseFragment(value);
  let changed = false;
  function walk(node) {
    for (const attr of node.attrs || []) {
      if (attr.name !== 'href' && attr.name !== 'src') continue;
      const next = map(attr.value, source);
      if (next !== attr.value) {
        attr.value = next;
        changed = true;
      }
    }
    for (const child of node.childNodes || []) walk(child);
  }
  walk(fragment);
  return changed ? serialize(fragment) : value;
}

export async function transformMarkdown(markdown, source, map) {
  const processor = unified().use(remarkParse).use(remarkGfm).use(remarkStringify, {
    bullet: '-', fences: true, listItemIndent: 'one',
  });
  const tree = processor.parse(markdown);
  tree.children = tree.children.filter(node => {
    if (node.type !== 'paragraph') return true;
    const text = textContent(node);
    return ![ 'English', '简体中文', '日本語', '한국어' ].every(label => text.includes(label));
  });
  visit(tree, node => {
    if ([ 'link', 'image', 'definition' ].includes(node.type)) node.url = map(node.url, source);
    if (node.type === 'html') node.value = rewriteHtml(node.value, source, map);
  });
  return processor.stringify(tree);
}

export function routeFile(route, extension = '.md') {
  return (route.endsWith('/') ? `${route}index` : route).slice(1) + extension;
}
