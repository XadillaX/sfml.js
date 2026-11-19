'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vscode = require('vscode');
const contracts = [];

/**
 * Record an editor contract after its actual assertions have passed.
 * @param {string} name Verified behavior.
 */
function passed(name) {
  contracts.push(name);
  console.log(`PASS ${name}`);
}

/**
 * Wait for the real language client to publish the expected document state.
 * @param {object} document Open editor document.
 * @param {Function} predicate Required diagnostic condition.
 * @return {Promise<void>} Resolves on a matching diagnostics notification.
 */
function waitForDiagnostics(document, predicate) {
  return new Promise((resolve, reject) => {
    let subscription;
    const timer = setTimeout(() => {
      subscription?.dispose();
      reject(new Error(`Diagnostics timed out for ${document.uri}`));
    }, 15000);
    const check = () => {
      const diagnostics = vscode.languages.getDiagnostics(document.uri);
      if (predicate(diagnostics)) {
        clearTimeout(timer);
        subscription?.dispose();
        resolve();
      }
    };
    subscription = vscode.languages.onDidChangeDiagnostics(check);
    check();
  });
}

/**
 * Verify the bundled client and server inside the installed VS Code host.
 * Test documents are untitled and never modify project or user files.
 * @return {Promise<void>} Resolves after all editor contracts pass.
 */
async function verifyEditor() {
  const extension = vscode.extensions.getExtension(
    'xadillax.sfmljs-rmlui-vscode');
  assert.ok(extension, 'Development extension must be registered');
  await extension.activate();
  assert.equal(extension.isActive, true);
  const commands = await vscode.commands.getCommands(true);
  for (const command of extension.packageJSON.contributes.commands) {
    assert.ok(commands.includes(command.command), command.command);
  }
  passed(`editor-${vscode.version}-activation-and-commands`);

  const stylesheet = await vscode.workspace.openTextDocument({
    language: 'rcss',
    content: 'body {\n  display: flex;\n  color: #ff0000;\n' +
      '  unknown-editor-property: 1;\n  flex\n}',
  });
  await vscode.window.showTextDocument(stylesheet);
  await waitForDiagnostics(stylesheet, diagnostics => diagnostics.some(
    item => item.source === 'rmlui' &&
      item.code === 'rcss-unknown-property'));
  const completion = await vscode.commands.executeCommand(
    'vscode.executeCompletionItemProvider', stylesheet.uri,
    new vscode.Position(4, 6));
  assert.ok(completion.items.some(item =>
    item.label === 'flex-direction' ||
    item.label?.label === 'flex-direction'));
  passed('editor-rcss-completion-and-unknown-property-diagnostics');

  const hover = await vscode.commands.executeCommand(
    'vscode.executeHoverProvider', stylesheet.uri,
    new vscode.Position(1, 5));
  assert.ok(hover.some(item => item.contents.some(content =>
    /display|flex/i.test(content.value || String(content)))));
  const colors = await vscode.commands.executeCommand(
    'vscode.executeDocumentColorProvider', stylesheet.uri);
  assert.ok(colors.some(item => item.color.red === 1 &&
    item.color.green === 0 && item.color.blue === 0));
  passed('editor-rcss-hover-and-color-provider');

  const markup = await vscode.workspace.openTextDocument({
    language: 'rml',
    content: '<rml><head></head><body><unknown-editor-tag />\n<in\n' +
      '</body></rml>',
  });
  await vscode.window.showTextDocument(markup);
  await waitForDiagnostics(markup, diagnostics => diagnostics.some(
    item => item.source === 'rmlui' &&
      item.message.includes('unknown-editor-tag')));
  const tags = await vscode.commands.executeCommand(
    'vscode.executeCompletionItemProvider', markup.uri,
    new vscode.Position(1, 3));
  assert.ok(tags.items.some(item =>
    item.label === 'input' || item.label?.label === 'input'));
  passed('editor-rml-tag-completion-and-custom-tag-diagnostic');

  await vscode.commands.executeCommand('rmlui.restartLanguageServer');
  const edit = new vscode.WorkspaceEdit();
  const tagOffset = markup.getText().indexOf('unknown-editor-tag');
  edit.replace(markup.uri, new vscode.Range(
    markup.positionAt(tagOffset),
    markup.positionAt(tagOffset + 'unknown-editor-tag'.length)
  ), 'after-restart-tag');
  assert.equal(await vscode.workspace.applyEdit(edit), true);
  await waitForDiagnostics(markup, diagnostics => diagnostics.some(
    item => item.source === 'rmlui' &&
      item.message.includes('after-restart-tag')));
  passed('editor-restarted-server-handles-document-updates');
}

/**
 * Return execution evidence to the launcher, including partial failures.
 * @return {Promise<void>} Resolves only after verified editor behavior.
 */
async function run() {
  const report = {
    runId: process.env.RMLUI_EDITOR_RUN_ID,
    vscode: vscode.version,
    status: 'failed',
    contracts,
  };
  try {
    await verifyEditor();
    report.status = 'passed';
  } catch (error) {
    report.error = error.stack || error.message;
    throw error;
  } finally {
    fs.writeFileSync(process.env.RMLUI_EDITOR_RESULT,
      JSON.stringify(report, null, 2) + '\n');
  }
}

module.exports = { run };
