import { access, readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'parse5';
import {
  buildManifest,
  legacyDirectories,
  legacyRootFiles,
  locales,
  outputDir,
  routeFile,
} from './content.mjs';
import { htmlFiles } from './redirects.mjs';

function inspectHtml(html) {
  const ids = new Set();
  const links = [];
  function walk(node) {
    for (const attr of node.attrs || []) {
      if (
        attr.name === 'id' ||
        (node.tagName === 'a' && attr.name === 'name')
      ) {
        ids.add(attr.value);
      }
      if ([ 'href', 'src', 'poster' ].includes(attr.name)) {
        links.push(attr.value);
      }
      if (attr.name === 'srcset') {
        links.push(
          ...attr.value
            .split(',')
            .map(candidate => candidate.trim().split(/\s+/)[0])
        );
      }
    }
    for (const child of node.childNodes || []) {
      walk(child);
    }
  }
  walk(parse(html));
  return { ids, links };
}

function resolveOutputFile(directory, pathname) {
  const path = decodeURIComponent(pathname).replace(/^\/+/, '');
  const candidates = pathname.endsWith('/') ? [ `${path}index.html` ] :
    [ path, `${path}.html`, `${path}/index.html` ];
  return candidates.find(file => {
    const absolute = resolve(directory, file);
    return (
      absolute.startsWith(`${resolve(directory)}/`) &&
      existsSync(absolute) &&
      statSync(absolute).isFile()
    );
  });
}

export async function auditHtmlFiles(directory) {
  const files = await htmlFiles(directory);
  const pages = new Map();
  for (const file of files) {
    pages.set(
      file,
      inspectHtml(await readFile(resolve(directory, file), 'utf8'))
    );
  }
  const errors = new Set();
  for (const [ file, page ] of pages) {
    for (const link of page.links) {
      if (
        !link ||
        link === '#' ||
        /^(?:data:|mailto:|tel:|javascript:)/i.test(link)
      ) {
        continue;
      }
      let url;
      try {
        url = new URL(link, `https://site.invalid/${file}`);
      } catch {
        errors.add(`${file}: invalid URL ${link}`);
        continue;
      }
      if (![ 'site.invalid', 'sfml.js.org' ].includes(url.hostname)) {
        continue;
      }
      const target = resolveOutputFile(directory, url.pathname);
      if (!target) {
        errors.add(`${file}: missing local target ${link}`);
        continue;
      }
      const targetPage = pages.get(target);
      if (
        url.hash &&
        targetPage &&
        !targetPage.ids.has(decodeURIComponent(url.hash.slice(1)))
      ) {
        errors.add(`${file}: missing anchor ${link}`);
      }
    }
  }
  return [ ...errors ];
}

async function checkSite() {
  const manifest = buildManifest();
  const required = [
    ...manifest.map(page => routeFile(page.route, '.html')),
    '404.html',
    ...locales.flatMap(locale => {
      const prefix = locale.prefix.slice(1) + (locale.prefix ? '/' : '');
      return [
        'index.html',
        'classes/RenderWindow.html',
        'assets/game-icons/icons.css',
        'assets/game-icons/LICENSE.txt',
      ].map(file => `${prefix}reference/${file}`);
    }),
    'media/sfml-js-symbol-pentagon.svg',
    'media/sfml-js-logo-pentagon.svg',
    'media/sfml-js-logo-pentagon-dark.svg',
    'media/sfml-js-wordmark.svg',
    'media/sfml-js-wordmark-dark.svg',
    'media/icons/game-icons/icons.css',
    'media/icons/game-icons/LICENSE.txt',
    'media/icons/game-icons/sources.json',
    'media/breakout.png',
    'media/render-texture.png',
    'CNAME',
    '.nojekyll',
    'sitemap.xml',
  ];
  for (const file of required) {
    await access(resolve(outputDir, file)).catch(() => {
      throw new Error(`Missing site output: ${file}`);
    });
  }
  for (const page of manifest) {
    const html = await readFile(
      resolve(outputDir, routeFile(page.route, '.html')),
      'utf8'
    );
    const document = parse(html);
    const element = document.childNodes.find(node => node.tagName === 'html');
    const lang = element?.attrs.find(attr => attr.name === 'lang')?.value;
    if (lang !== page.locale.lang) {
      throw new Error(`Incorrect locale in ${page.route}: ${lang}`);
    }
  }
  const referenceFiles = await htmlFiles(resolve(outputDir, 'reference'));
  for (const locale of locales) {
    const directory = resolve(outputDir, locale.prefix.slice(1), 'reference');
    const files = await htmlFiles(directory);
    if (files.join('\n') !== referenceFiles.join('\n')) {
      throw new Error(`API page coverage differs for ${locale.id}`);
    }
    for (const file of files) {
      const html = await readFile(resolve(directory, file), 'utf8');
      const document = parse(html);
      const element = document.childNodes.find(node => node.tagName === 'html');
      const lang = element?.attrs.find(attr => attr.name === 'lang')?.value;
      const expected = locale.id === 'root' ? 'en' : locale.id;
      if (lang !== expected) {
        throw new Error(
          `Incorrect API locale: ${locale.id}/${file}: ${lang}`
        );
      }
      if (!html.includes('data-api-language="ko"')) {
        throw new Error(
          `Missing API language navigation: ${locale.id}/${file}`
        );
      }
    }
  }
  const aliases = referenceFiles.filter(
    path =>
      legacyDirectories.includes(path.split('/')[0]) ||
      legacyRootFiles.includes(path)
  );
  if (!aliases.length) {
    throw new Error('No legacy API routes were generated');
  }
  for (const path of aliases) {
    const html = await readFile(resolve(outputDir, path), 'utf8');
    if (
      !html.includes('location.search + location.hash') ||
      !html.includes(`/reference/${path}`)
    ) {
      throw new Error(`Invalid legacy redirect: ${path}`);
    }
  }
  const errors = await auditHtmlFiles(outputDir);
  if (errors.length) {
    throw new Error(
      `Site output validation failed:\n${errors.join('\n')}`
    );
  }
  console.log(
    `Validated ${manifest.length} localized pages, ` +
    `${referenceFiles.length} API pages × ${locales.length} languages, ` +
    `${aliases.length} redirects and all local links/assets`
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  await checkSite();
}
