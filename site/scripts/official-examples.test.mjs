import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  buildManifest,
  createLinkMapper,
  transformMarkdown,
} from './content.mjs';

const map = createLinkMapper(buildManifest());
const guides = [
  [ 'README.md', '/examples/official' ],
  [ 'README.zh-CN.md', '/zh/examples/official' ],
  [ 'README.ja.md', '/ja/examples/official' ],
  [ 'README.ko.md', '/ko/examples/official' ],
];

for (const [ readme, route ] of guides) {
  test(`official guide links stay on the site: ${readme}`, async () => {
    const source = `examples/${readme}`;
    const markdown = await readFile(new URL(`../../${source}`,
      import.meta.url), 'utf8');
    const output = await transformMarkdown(markdown, source, map);

    assert.ok(output.includes(`](${route})`));
    assert.equal(map('official/README.md#platform', source),
      `${route}#platform`);
    assert.equal(map(`../${readme}`, `examples/official/${readme}`),
      route.replace(/\/official$/, ''));
  });

  test(`official preview links use shared media: ${readme}`, async () => {
    const source = `examples/official/${readme}`;
    const markdown = await readFile(new URL(`../../${source}`,
      import.meta.url), 'utf8');
    const output = await transformMarkdown(markdown, source, map);
    const image = '/media/examples/official/screenshots/vulkan.png';

    assert.ok(output.includes(`href="${image}"`));
    assert.ok(output.includes(`src="${image}"`));
    assert.equal(map('screenshots/vulkan.png?raw=1', source),
      `${image}?raw=1`);
    assert.equal(map('vulkan/Vulkan.cjs', source),
      'https://github.com/XadillaX/node-sfml/blob/main/' +
      'examples/official/vulkan/Vulkan.cjs');
  });
}
