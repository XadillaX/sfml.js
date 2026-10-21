import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { Application, DefaultTheme, JSX } from 'typedoc';
import { parse } from 'parse5';
import { rootDir } from './content.mjs';
import { createGameIcons } from '../../tools/typedoc/icons.mjs';

/**
 * Collect SVG nodes from rendered output, independent of attribute order.
 * @param {object} node - HTML tree to inspect.
 * @param {Function} predicate - Select matching nodes.
 */
function elements(node, predicate) {
  return [
    ...(predicate(node) ? [ node ] : []),
    ...(node.childNodes || []).flatMap(child => elements(child, predicate)),
  ];
}
const attr = (node, name) =>
  node.attrs?.find(item => item.name === name)?.value;

test('TypeDoc uses only attributed Game Icons artwork', async () => {
  const app = await Application.bootstrap({ logLevel: 'Error' });
  const theme = new DefaultTheme(app.renderer);
  const icons = createGameIcons(theme.icons);
  assert.deepEqual(Object.keys(icons), Object.keys(theme.icons));
  const directory = resolve(rootDir, 'assets/icons/game-icons');
  const { icons: sources } = JSON.parse(
    await readFile(resolve(directory, 'sources.json'), 'utf8')
  );
  for (const [ key, builder ] of Object.entries(icons)) {
    const document = parse(JSX.renderElement(builder()));
    const svg = elements(document, node => node.tagName === 'svg')[0];
    const name = attr(svg, 'data-game-icon');
    assert.ok(sources[name], `${key} has no attributed source`);
    const source = parse(await readFile(resolve(directory, `${name}.svg`),
      'utf8'));
    const paths = node => elements(node, item => item.tagName === 'path')
      .map(item => attr(item, 'd'));
    assert.deepEqual(paths(svg), paths(source), key);
    assert.equal(elements(svg, node =>
      [ 'text', 'rect', 'polygon', 'circle', 'line' ].includes(node.tagName)
    ).length, 0, `${key} contains non-catalog artwork`);
  }
  assert.throws(() => createGameIcons({ futureIcon: () => {} }),
    /Unmapped TypeDoc icon/);
});

test('lazy search controls have explicit Game Icons replacements', async () => {
  const component = await readFile(resolve(rootDir,
    'site/node_modules/vitepress/dist/client/theme-default/' +
    'components/VPLocalSearchBox.vue'), 'utf8');
  const css = await readFile(resolve(rootDir,
    'site/.vitepress/theme/custom.css'), 'utf8');
  const names = new Set(component.match(/vpi-[a-z-]+/g));
  for (const name of names) {
    assert.match(css, new RegExp(
      `\\.${name}[^{}]*\\{\\s*--icon:\\s*var\\(--gi-[a-z-]+\\)`
    ), `Unmapped lazy search icon: ${name}`);
  }
});
