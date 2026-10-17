import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { legacyDirectories, legacyRootFiles, outputDir } from './content.mjs';

export function redirectHtml(path) {
  const first = path.split('/')[0];
  if (!/^[a-zA-Z0-9_./-]+\.html$/.test(path) || path.split('/').includes('..') ||
      !(legacyDirectories.includes(first) || legacyRootFiles.includes(path))) {
    throw new Error(`Invalid legacy path: ${path}`);
  }
  const target = `/reference/${path}`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<link rel="canonical" href="${target}">
<title>API reference | sfml.js</title>
<script>location.replace(${JSON.stringify(target)} + location.search + location.hash);</script>
</head><body><p>The API reference has moved. <a href="${target}">Open the reference</a>.</p></body></html>
`;
}

export async function htmlFiles(directory, prefix = '') {
  const result = [];
  for (const entry of await readdir(resolve(directory, prefix), { withFileTypes: true })) {
    const path = prefix + entry.name;
    if (entry.isDirectory()) result.push(...await htmlFiles(directory, `${path}/`));
    else if (entry.name.endsWith('.html')) result.push(path);
  }
  return result;
}

export async function generateRedirects(directory = outputDir) {
  const files = await htmlFiles(resolve(directory, 'reference'));
  const aliases = files.filter(path =>
    legacyDirectories.includes(path.split('/')[0]) || legacyRootFiles.includes(path));
  for (const path of aliases) {
    const destination = resolve(directory, path);
    const html = redirectHtml(path);
    await mkdir(resolve(destination, '..'), { recursive: true });
    await writeFile(destination, html);
  }
  return aliases;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  console.log(`Generated ${(await generateRedirects()).length} legacy API redirects`);
}
