import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Application } from 'typedoc';
import ts from 'typescript';
import { parse } from 'parse5';
import { registerSiteTheme } from './typedoc/theme.mjs';

/**
 * Read rendered elements without coupling assertions to HTML attribute order.
 * @param {object} root - HTML node at which to begin searching.
 * @param {Function} predicate - Match a node in the HTML tree.
 */
function elements(root, predicate) {
  return [
    ...(predicate(root) ? [ root ] : []),
    ...(root.childNodes || []).flatMap(child => elements(child, predicate)),
  ];
}
const attr = (node, name) =>
  node.attrs?.find(item => item.name === name)?.value;
const hasClass = (node, name) => attr(node, 'class')?.split(' ').includes(name);
const text = node => node.value || (node.childNodes || []).map(text).join('');
const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));
const iconStylesheetPath = resolve(
  repositoryRoot,
  'packages/sfml.js/assets/icons/game-icons/icons.css'
);

test('module navigation retains nested APIs and ' +
     'member details retain callable contracts', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'sfml-reference-theme-'));
  try {
    const graphics = resolve(directory, 'src/graphics');
    const system = resolve(directory, 'src/system');
    await mkdir(graphics, { recursive: true });
    await mkdir(system, { recursive: true });
    await writeFile(resolve(graphics, 'render.ts'), `
export const native: unique symbol = Symbol();
/** A rendering surface. */
export class RenderTarget {
  /** Draw values.
   * @param values - The vertices to draw.
   * @returns Number of drawn vertices.
   */
  draw(...values: number[]): number { return values.length; }
}
/** A rendering window. */
export class RenderWindow extends RenderTarget {
  /** Open the window.
   * @param title - The window title.
   */
  open(title = 'SFML'): void {}
  /** Access native storage. */
  [native](): void {}
}
/** Shader helpers. */
export namespace Glsl {
  /** A vector. */
  export interface Vector { x: number }
}
`);
    await writeFile(
      resolve(system, 'clock.ts'),
      '/** A clock. */ export class Clock {}'
    );
    const entry = resolve(directory, 'index.ts');
    await writeFile(
      entry,
      "export * from './src/graphics/render'; export " +
      "* from './src/system/clock';"
    );
    const app = await Application.bootstrap({
      entryPoints: [ entry ], readme: 'none', logLevel: 'Error',
    });
    app.options.setCompilerOptions(
      [ entry ],
      { skipLibCheck: true, target: ts.ScriptTarget.ES2020 },
      undefined
    );
    registerSiteTheme(app, {
      locale: { id: 'en', reference: 'API reference', contents: 'Contents' },
      languages: [], home: '/', localeHref: () => '/',
    });
    const project = await app.convert();
    assert.ok(project, 'TypeDoc converts the fixture');
    await app.generateDocs(project, resolve(directory, 'out'));
    const windowPage = parse(
      await readFile(
        resolve(directory, 'out/classes/RenderWindow.html'),
        'utf8'
      )
    );
    const nav = elements(
      windowPage,
      node => attr(node, 'id') === 'sf-api-module-nav'
    )[0];
    assert.ok(nav, 'static module navigation is rendered');
    const graphicsGroup = elements(
      nav,
      node => attr(node, 'data-module') === 'graphics'
    )[0];
    assert.ok(graphicsGroup);
    assert.ok(elements(
      graphicsGroup,
      node => hasClass(node, 'gi-graphics')
    ).length);
    const hrefs = elements(graphicsGroup, node => node.tagName === 'a').map(
      node =>
        new URL(
          attr(node, 'href'),
          'https://site.invalid/classes/RenderWindow.html'
        ).pathname
    );
    assert.ok(hrefs.includes('/classes/RenderWindow.html'));
    assert.ok(
      hrefs.includes('/interfaces/Glsl.Vector.html'),
      'nested namespace APIs remain discoverable'
    );
    const current = elements(
      nav,
      node => attr(node, 'aria-current') === 'page'
    );
    assert.equal(current.length, 1);
    assert.equal(text(current[0]), 'RenderWindow');
    const parameters = elements(windowPage, node =>
      hasClass(node, 'sf-api-parameters')
    );
    assert.match(
      parameters.map(text).join(' '),
      /\.\.\.values.*number\[\].*The vertices to draw/s
    );
    assert.match(
      parameters.map(text).join(' '),
      /title.*SFML.*The window title/s
    );
    assert.match(text(windowPage), /Number of drawn vertices/);
    const ids = elements(windowPage, node => attr(node, 'id')).map(
      node => attr(node, 'id')
    );
    assert.ok(
      ids.includes('draw') && ids.includes('open'),
      'inherited and local anchors survive the renderer'
    );
    const symbolGroup = elements(windowPage, node =>
      hasClass(node, 'tsd-member-group')
    ).find(node =>
      text(node.childNodes[0]).includes('Symbol members')
    );
    assert.ok(
      symbolGroup,
      'symbol protocols remain accessible after the ordinary members'
    );
    assert.equal(attr(symbolGroup, 'open'), undefined);
    assert.match(text(symbolGroup), /Access native storage/);
    const overview = parse(
      await readFile(resolve(directory, 'out/index.html'), 'utf8')
    );
    for (const name of [ 'graphics', 'system' ]) {
      assert.ok(
        elements(
          overview,
          node => attr(node, 'id') === `module-${name}`
        ).length
      );
    }
    const featured = elements(overview, node =>
      hasClass(node, 'sf-api-featured')
    );
    assert.match(featured.map(text).join(' '), /A rendering window/);
    const pageNav = elements(overview, node =>
      hasClass(node, 'sf-api-page-nav')
    )[0];
    assert.equal(elements(pageNav, node => node.tagName === 'a').length, 2,
      'overview local navigation lists modules instead of every export');
    assert.equal(app.logger.hasErrors(), false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('ImGui module groups use the same attributed icon treatment', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'sfml-imgui-icons-'));
  try {
    await mkdir(resolve(directory, 'src'), { recursive: true });
    await writeFile(resolve(directory, 'src/api.ts'), `
/** SFML window integration. */
export namespace SFML {
  /** Initialize ImGui. */
  export function Init(): void {
  }
  /** Start a frame. */
  export function Update(): void {
  }
  /** Render a frame. */
  export function Render(): void {
  }
}

/** Dear ImGui controls. */
export namespace ImGui {
  /** Begin a window. */
  export function Begin(): boolean {
    return true;
  }
  /** Draw a button. */
  export function Button(): boolean {
    return false;
  }
  /** Edit text through a callback. */
  export function InputTextEx(): boolean {
    return false;
  }
}

/** Return the font atlas. */
export function getFontAtlas(): null {
  return null;
}
/** Return style colors. */
export function getStyleColors(): Float32Array {
  return new Float32Array();
}
`);
    const entry = resolve(directory, 'index.ts');
    await writeFile(entry, "export * from './src/api';");
    const app = await Application.bootstrap({
      name: 'sfml.js-imgui',
      entryPoints: [ entry ],
      readme: 'none',
      logLevel: 'Error',
    });
    app.options.setCompilerOptions(
      [ entry ],
      { skipLibCheck: true, target: ts.ScriptTarget.ES2020 },
      undefined
    );
    registerSiteTheme(app, {
      locale: { id: 'en', reference: 'API reference', contents: 'Contents' },
      languages: [],
      home: '/',
      localeHref: () => '/',
    });
    const project = await app.convert();
    assert.ok(project);
    await app.generateDocs(project, resolve(directory, 'out'));

    const overview = parse(await readFile(
      resolve(directory, 'out/index.html'),
      'utf8'
    ));
    const iconStylesheet = await readFile(iconStylesheetPath, 'utf8');
    const expectedIcons = {
      SFML: 'gi-window',
      ImGui: 'gi-list',
      fonts: 'gi-document',
    };
    for (const [ moduleId, iconClass ] of Object.entries(expectedIcons)) {
      const iconName = iconClass.slice('gi-'.length);
      assert.match(
        iconStylesheet,
        new RegExp(`\\.${iconClass}\\s*{[^}]*var\\(--gi-${iconName}\\)`),
        `${iconClass} is registered in the shared icon stylesheet`
      );
      const section = elements(
        overview,
        node => attr(node, 'id') === `module-${moduleId}`
      )[0];
      assert.ok(section, `${moduleId} section exists`);
      assert.ok(
        elements(section, node => hasClass(node, iconClass)).length,
        `${moduleId} overview has ${iconClass}`
      );

      const nav = elements(
        overview,
        node => attr(node, 'data-module') === moduleId
      )[0];
      assert.ok(nav, `${moduleId} navigation group exists`);
      assert.ok(
        elements(nav, node => hasClass(node, iconClass)).length,
        `${moduleId} navigation has ${iconClass}`
      );
    }
    assert.equal(app.logger.hasErrors(), false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
