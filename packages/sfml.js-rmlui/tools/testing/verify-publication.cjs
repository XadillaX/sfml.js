'use strict';

const fs = require('node:fs');
const path = require('node:path');

const audit = path.resolve(__dirname, '../../../../docs/rmlui/audit/6.3');
const parityPolicy = require('../../test/visual/upstream-failures.json');

/**
 * Recheck driver outcomes and the exact reviewed assertion stack.
 * @param {object} row Measured page ledger.
 * @param {string} scope Content or interaction.
 * @return {string} Pass, diagnosed upstream deferral, or failure.
 */
function bindingStatus(row, scope) {
  const results = row[
    scope === 'content' ? 'contentResults' : 'interactionResults'
  ];
  const { sfml, gl3 } = results || {};
  if (!sfml || !gl3) {
    return 'fail';
  }
  if (sfml.status === 'pass' && gl3.status === 'pass') {
    return Array.isArray(sfml.assertions) && sfml.assertions.length > 0 &&
      JSON.stringify(sfml.assertions) === JSON.stringify(gl3.assertions) ?
      'pass' : 'fail';
  }
  if (sfml.status !== 'fail' || gl3.status !== 'fail' ||
      sfml.failure?.type !== 'AssertionError' ||
      gl3.failure?.type !== 'AssertionError') {
    return 'fail';
  }
  const entry = parityPolicy.failures.find(entry =>
    entry.name === row.name && entry.scope === scope &&
    entry.sha256 === (scope === 'content' ? row.sha256 : row.sourceSHA256));
  return entry &&
    JSON.stringify(sfml.failure.stack) === JSON.stringify(entry.stack) &&
    JSON.stringify(gl3.failure.stack) === JSON.stringify(entry.stack) ?
    'upstream-failure-deferred' : 'fail';
}

/**
 * Validate measured frame records, never exempting a deferred page's pixels.
 * @param {object} frame One independent reference checkpoint.
 * @param {boolean} interaction Require byte-exact input checkpoints.
 * @return {boolean} Whether pixels, geometry and hashes contain valid evidence.
 */
function frameAccepted(frame, interaction) {
  const pixels = interaction ? frame.pixels : frame.pixelComparison;
  const maximum = interaction ?
    frame.layoutMaximum : frame.maxLayoutDifference;
  const reference = interaction ?
    frame.referenceSHA256 : frame.referencePNGHash;
  const actual = interaction ? frame.actualSHA256 : frame.actualPNGHash;
  return pixels?.pass === true && pixels.maxChannelDifference <= 1 &&
    pixels.pixelsBeyondOneByte === 0 && Number.isFinite(maximum) &&
    maximum >= 0 && maximum <= 0.005 &&
    /^[a-f0-9]{64}$/.test(reference) && /^[a-f0-9]{64}$/.test(actual) &&
    (!interaction || (pixels.differentPixels === 0 && reference === actual));
}

/**
 * Recompute visual acceptance from page-level evidence, including raw failures.
 * @param {object} report Content or input ledger.
 * @param {string} scope Content or interaction.
 * @return {boolean} Whether every page establishes binding parity.
 */
function visualAccepted(report, scope) {
  const interaction = scope === 'interaction';
  const { pages, summary } = report;
  if (!Array.isArray(pages) || !summary ||
      report.acceptancePolicy !== parityPolicy.version ||
      (interaction ? pages.length < 25 : pages.length !== 113) ||
      summary.pages !== pages.length ||
      new Set(pages.map(row => row.name)).size !== pages.length) {
    return false;
  }
  let passed = 0;
  let deferred = 0;
  let frames = 0;
  for (const row of pages) {
    const status = bindingStatus(row, scope);
    if (status === 'fail' || status !== row.bindingStatus ||
        row.bindingAccepted !== true) {
      return false;
    }
    const rawStatus = interaction ? row.status : row.contentStatus;
    if (rawStatus !== (status === 'pass' ? 'pass' : 'fail')) {
      return false;
    }
    const checkpoints = interaction ? row.frames :
      [ ...(row.referenceFrames || []), ...(row.matchReferenceFrames || []) ];
    if (!checkpoints?.length ||
        !checkpoints.every(frame => frameAccepted(frame, interaction)) ||
        (!interaction && row.upstreamMatch &&
          row.upstreamMatch.featureStatus !== 'pass')) {
      return false;
    }
    frames += checkpoints.length;
    passed += status === 'pass' ? 1 : 0;
    deferred += status === 'upstream-failure-deferred' ? 1 : 0;
  }
  const countsMatch = summary.frames === frames &&
    summary.deferredUpstreamFailures === deferred &&
    summary.bindingRegressions === 0;
  return countsMatch && (interaction ?
    summary.bindingAccepted === true && summary.pass === passed &&
      summary.fail === deferred &&
      summary.byteExactFrames === frames :
    summary.bindingContentAccepted === true &&
      summary.positivePass === passed &&
      summary.nativePositivePass === passed &&
      summary.positiveFail === deferred &&
      summary.positivePending === 0 && summary.referenceFailures === 0 &&
      summary.nativePositiveMismatch === 0 &&
      summary.upstreamContentDisagreements === deferred &&
      summary.upstreamMatchFeatureFail === 0);
}

/**
 * Load the actual source-controlled acceptance records for publication.
 * @return {object} Core, rendering, input and delivery evidence.
 */
function readEvidence() {
  const files = {
    core: 'core-19-evidence.json',
    visual: 'visual-corpus-evidence.json',
    interactions: 'visual-interaction-evidence.json',
    ime: 'native-ime-checkpoint.json',
    delivery: 'source-package-editor-evidence.json',
  };
  return Object.fromEntries(Object.entries(files).map(([ name, filename ]) => [
    name, JSON.parse(fs.readFileSync(path.join(audit, filename), 'utf8')),
  ]));
}

/**
 * Reject incomplete acceptance even when builds and runtime suites pass.
 * Positive counts prevent a manually changed pass flag accepting blank output.
 * @param {object} evidence Acceptance records for the candidate revision.
 * @return {string[]} Required gates which have not passed.
 */
function publicationFailures(evidence) {
  const { core, visual, interactions, ime, delivery } = evidence;
  const browser = delivery.documentation.rmlui_browser;
  const gates = [
    [
      'Core scope and independent review',
      core.scope_complete === true && core.criteria_reviewed === 19 &&
        core.independent_review_completed === true,
    ],
    [
      '113 VisualTests positive content',
      visualAccepted(visual, 'content'),
    ],
    [
      'VisualTests live interactions',
      visualAccepted(interactions, 'interaction'),
    ],
    [
      'Physical and cross-platform IME',
      ime.full_acceptance === true && ime.independent_acceptance === true &&
        ime.physical_input_method_acceptance === true &&
        ime.other_platform_native_ime_acceptance === true,
    ],
    [
      'Whole delivery acceptance',
      delivery.whole_scope_acceptance === true &&
        delivery.editor.host_contracts >= 5 && browser?.passed === true &&
        browser.page_count > 0 && browser.viewport_count >= 3,
    ],
  ];
  return gates.filter(gate => !gate[1]).map(([ name ]) => name);
}

if (require.main === module) {
  const failures = publicationFailures(readEvidence());
  for (const failure of failures) {
    console.error(`UNACCEPTED ${failure}`);
  }
  if (failures.length) {
    process.exitCode = 1;
  } else {
    console.log('PASS complete RmlUi publication acceptance');
  }
}

module.exports = { readEvidence, publicationFailures };
