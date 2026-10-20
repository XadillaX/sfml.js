import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { copyBranding } from '../../tools/branding.mjs';
import {
  buildManifest,
  createLinkMapper,
  rootDir,
  routeFile,
  sourceDir,
  transformMarkdown,
} from './content.mjs';

const manifest = buildManifest();
const map = createLinkMapper(manifest);

// Only the generated source tree is disposable; the theme and
// Markdown sources stay in place.
await rm(sourceDir, { recursive: true, force: true });
await mkdir(resolve(sourceDir, 'public/media'), { recursive: true });

for (const page of manifest) {
  let text;
  const frontmatter = {
    lang: page.locale.lang,
    sourcePath: page.source,
  };
  // The last guide has no next Markdown page; TypeDoc is a separate renderer.
  if (page.route.endsWith('/examples/ported')) {
    frontmatter.next = false;
  }
  if (page.home) {
    Object.assign(frontmatter, {
      layout: 'home',
      sfmlHome: true,
      title: page.locale.title,
      description: page.locale.description,
    });
    text = '';
  } else {
    text = await transformMarkdown(
      await readFile(resolve(rootDir, page.source), 'utf8'),
      page.source,
      map
    );
  }
  const metadata = Object.entries(frontmatter)
    .map(([ key, value ]) => `${key}: ${JSON.stringify(value)}`)
    .join('\n');
  const destination = resolve(sourceDir, routeFile(page.route));
  await mkdir(resolve(destination, '..'), { recursive: true });
  await writeFile(destination, `---\n${metadata}\n---\n\n${text}`);
}

await cp(resolve(rootDir, 'assets'), resolve(sourceDir, 'public/media'), {
  recursive: true,
  // Original image-generation files document provenance, not website assets.
  filter: source => source !== resolve(rootDir, 'assets/branding'),
});
await copyBranding(resolve(sourceDir, 'public/media'));
await cp(
  resolve(rootDir, 'examples/ported/assets'),
  resolve(sourceDir, 'public/media/examples/ported/assets'),
  { recursive: true }
);
await cp(
  resolve(rootDir, 'examples/official/screenshots'),
  resolve(sourceDir, 'public/media/examples/official/screenshots'),
  { recursive: true }
);
await writeFile(resolve(sourceDir, 'public/.nojekyll'), '');
await writeFile(resolve(sourceDir, 'public/CNAME'), 'sfml.js.org\n');
console.log(
  `Prepared ${manifest.length} pages across four locales in ${sourceDir}`
);
