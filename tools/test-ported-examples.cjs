'use strict';

const { spawn } = require('node:child_process');
const { join } = require('node:path');
const { mkdtemp, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');

const examples = [
  'color', 'font', 'joystick', 'rect', 'sensor', 'sound_buffer', 'texture',
  'time', 'touch', 'vector2', 'vector3', 'vertex', 'video_mode',
  'render_window', 'render_window_display_async',
  'render_window_display_draw_async',
];
const root = join(__dirname, '../examples/ported');
const unsupported = new Set([
  'render_window_display_async', 'render_window_display_draw_async',
]);
async function main() {
  // A separate working directory verifies that asset paths are self-contained.
  const directory = await mkdtemp(join(tmpdir(), 'sfml-ported-run-'));
  let passed = 0;
  let skipped = 0;
  try {
    for (const name of examples) {
      const status = await new Promise((resolve, reject) => {
        const child = spawn(process.execPath,
          [ '--require', join(__dirname, 'ported-example-harness.cjs'),
            join(root, `${name}.cjs`) ],
          { cwd: directory, stdio: [ 'ignore', 'pipe', 'pipe' ],
            env: { ...process.env, TMPDIR: directory, TMP: directory,
              TEMP: directory, SFML_PORTED_OUTPUT: directory } });
        let output = '';
        child.stdout.on('data', chunk => { output += chunk; });
        child.stderr.on('data', chunk => { output += chunk; });
        const timeout = setTimeout(() => child.kill('SIGKILL'), 30000);
        child.on('error', error => { clearTimeout(timeout); reject(error); });
        child.on('close', (code, signal) => {
          clearTimeout(timeout);
          if (code === 2 && unsupported.has(name) &&
              output.includes('UNSUPPORTED:')) {
            console.log(`UNSUPPORTED ${name}: drawAsync/displayAsync`);
            resolve('unsupported');
          } else if (code !== 0) {
            reject(new Error(`${name}: ${signal ?? code}\n${output}`));
          } else {
            console.log(`PASS ${name}`);
            resolve('passed');
          }
        });
      });
      if (status === 'passed') passed++;
      else skipped++;
    }
    console.log(`${passed} passed; ${skipped} unsupported`);
  } finally { await rm(directory, { recursive: true, force: true }); }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
