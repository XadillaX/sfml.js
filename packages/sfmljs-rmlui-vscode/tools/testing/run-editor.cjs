'use strict';

const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '../..');
const output = process.env.RMLUI_TEST_OUTPUT ||
  path.join(os.tmpdir(), 'rmlui-63-completion');
fs.mkdirSync(output, { recursive: true });
const report = path.join(output, 'editor-host-result.json');
const runId = String(Date.now());
const environment = {
  ...process.env,
  RMLUI_EDITOR_RESULT: report,
  RMLUI_EDITOR_RUN_ID: runId,
};
// A terminal embedded in another editor must not redirect this CLI invocation
// through that editor's IPC socket instead of launching the installed Code.
delete environment.VSCODE_IPC_HOOK_CLI;
const result = spawnSync(process.env.VSCODE_CLI || 'code', [
  '--new-window',
  '--wait',
  '--verbose',
  `--extensionDevelopmentPath=${root}`,
  `--extensionTestsPath=${path.join(root, 'test/editor/extension.test.cjs')}`,
], { env: environment, stdio: 'inherit', timeout: 60000 });
if (result.error) {
  console.error(result.error.message);
}
process.exitCode = result.status || (result.error || result.signal ? 1 : 0);
if (process.exitCode === 0) {
  const evidence = fs.existsSync(report)
    ? JSON.parse(fs.readFileSync(report, 'utf8')) : null;
  if (evidence?.runId !== runId || evidence?.status !== 'passed' ||
      evidence?.contracts?.length !== 5) {
    console.error('The editor did not return passing evidence for this run');
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify(evidence, null, 2));
  }
}
