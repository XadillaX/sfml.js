import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../assets/branding/', import.meta.url));

/**
 * Copy shared vectors and generate readable wordmark colors for dark surfaces.
 * @param {string} destination - Directory receiving the branding assets.
 */
export async function copyBranding(destination) {
  await mkdir(destination, { recursive: true });
  for (const name of [
    'sfml-js-logo-pentagon.svg',
    'sfml-js-symbol-pentagon.svg',
    'sfml-js-wordmark.svg',
  ]) {
    await cp(resolve(source, name), resolve(destination, name));
  }
  for (const name of [
    'sfml-js-logo-pentagon',
    'sfml-js-wordmark',
  ]) {
    const svg = await readFile(resolve(source, `${name}.svg`), 'utf8');
    const dark = svg.replace(
      '<g id="wordmark">',
      '<style>.wordmark-primary{fill:#f5f8f1}' +
      '.wordmark-accent{fill:#a5d936}</style>\n' +
      '  <g id="wordmark">'
    );
    if (dark === svg) {
      throw new Error(`Missing wordmark group in ${name}.svg`);
    }
    await writeFile(resolve(destination, `${name}-dark.svg`), dark);
  }
}
