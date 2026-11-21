'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');

const audit = path.resolve(__dirname, '../../../../docs/rmlui/audit/6.3');
const root = path.resolve(__dirname, '../../../..');
const releaseChange = path.join(
  root, 'common/changes/sfml.js-rmlui/release-1.3.0.json'
);
const parityPolicy = require('../../test/visual/upstream-failures.json');
const { catalog } = require('../../test/visual/catalog.cjs');
const { required } = require('../../test/visual/interactions/coverage.cjs');

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
      (!interaction && pages.length !== 113) ||
      summary.pages !== pages.length ||
      new Set(pages.map(row => row.name)).size !== pages.length) {
    return false;
  }
  if (interaction) {
    const originals = catalog();
    const originalHashes = new Map(originals.map(row => [
      row.name, row.sha256,
    ]));
    const requiredPages = required(originals);
    const coverage = report.originalSourceCoverage;
    const covered = pages.map(row => row.name);
    if (!coverage ||
        JSON.stringify(coverage.required) !== JSON.stringify(requiredPages) ||
        JSON.stringify(coverage.covered) !== JSON.stringify(covered) ||
        !requiredPages.every(name => covered.includes(name)) ||
        !pages.every(row =>
          originalHashes.get(row.name) === row.sourceSHA256) ||
        summary.requiredInteractivePages !== requiredPages.length) {
      return false;
    }
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
    desktop: 'desktop-ime-attempt.json',
  };
  const evidence = Object.fromEntries(
    Object.entries(files).map(([ name, filename ]) => [
      name, JSON.parse(fs.readFileSync(path.join(audit, filename), 'utf8')),
    ])
  );
  const decision = path.join(audit, 'release-1.3.0-decision.json');
  if (fs.existsSync(decision)) {
    evidence.releaseDecision = JSON.parse(fs.readFileSync(decision, 'utf8'));
  }
  return evidence;
}

/**
 * Identify tracked package sources, normalizing only lockstep version metadata.
 * The gate and its tests do not change the code being approved for release.
 * @param {string} revision Commit or staged tree being reviewed.
 * @return {string} SHA-256 of the four package source inventories.
 */
function sourceFingerprint(revision = 'HEAD') {
  const names = [
    'sfml.js', 'sfml.js-imgui', 'sfml.js-interop', 'sfml.js-rmlui',
  ];
  const directories = names.map(name => `packages/${name}`);
  const metadata = new Set(directories.flatMap(directory => [
    `${directory}/package.json`,
    `${directory}/CHANGELOG.md`,
    `${directory}/CHANGELOG.json`,
  ]));
  metadata.add('packages/sfml.js-rmlui/tools/testing/verify-publication.cjs');
  metadata.add('packages/sfml.js-rmlui/test/tooling/publication.test.cjs');
  const inventory = execFileSync('git', [
    'ls-tree', '-r', revision, '--', ...directories,
  ], { cwd: root, encoding: 'utf8' });
  const hash = createHash('sha256');
  hash.update(inventory.split('\n').filter(row =>
    row && !metadata.has(row.split('\t')[1])).join('\n'));
  for (const directory of directories) {
    const manifest = JSON.parse(execFileSync('git', [
      'show', `${revision}:${directory}/package.json`,
    ], { cwd: root, encoding: 'utf8' }));
    delete manifest.version;
    const fields = [ 'dependencies', 'devDependencies', 'peerDependencies' ];
    for (const field of fields) {
      for (const name of names) {
        const range = manifest[field]?.[name];
        if (range) {
          manifest[field][name] = range.replace(
            /^[~^]?\d+\.\d+\.\d+$/, '<lockstep>'
          );
        }
      }
    }
    hash.update(`\n${directory}\n${JSON.stringify(manifest)}`);
  }
  return hash.digest('hex');
}

/**
 * Resolve the pending minor release before Rush applies lockstep versions.
 * @return {object} Candidate version and tracked source fingerprint.
 */
function readCandidate() {
  let { version } = require('../../package.json');
  if (version === '1.2.1' && fs.existsSync(releaseChange)) {
    const { changes } = JSON.parse(fs.readFileSync(releaseChange, 'utf8'));
    if (changes.some(change =>
      change.packageName === 'sfml.js-rmlui' && change.type === 'minor')) {
      version = '1.3.0';
    }
  }
  return { version, sourceFingerprint: sourceFingerprint() };
}

/**
 * Recognize release approval while retaining unfinished test records.
 * @param {object} evidence Recorded measurements and release decision.
 * @param {object} candidate Version and sources actually being published.
 * @return {boolean} Whether this specific release has user approval.
 */
function releaseApproved(evidence, candidate) {
  const decision = evidence.releaseDecision;
  return decision?.accepted_by_user === true &&
    decision.version === candidate.version &&
    /^[a-f0-9]{64}$/.test(decision.source_fingerprint) &&
    decision.source_fingerprint === candidate.sourceFingerprint &&
    Array.isArray(decision.deferred_gates);
}

/**
 * Reject incomplete acceptance even when builds and runtime suites pass.
 * Positive counts prevent a manually changed pass flag accepting blank output.
 * @param {object} evidence Acceptance records for the candidate revision.
 * @param {object} candidate Version and tracked sources for release approval.
 * @return {string[]} Required gates which have not passed.
 */
function publicationFailures(evidence, candidate = readCandidate()) {
  const { core, visual, interactions, ime, delivery, desktop } = evidence;
  const browser = delivery.documentation.rmlui_browser;
  const approved = releaseApproved(evidence, candidate);
  const deferred = name =>
    approved && evidence.releaseDecision.deferred_gates.includes(name);
  const desktopAccepted = desktop?.accepted === true &&
    desktop.accepted_by_user === true &&
    desktop.actual_engine_preedit_observed === true &&
    desktop.actual_engine_chinese_commit_observed === true &&
    desktop.actual_engine_cancel_observed === true &&
    desktop.actual_window_focus_rollback_observed === true &&
    desktop.scrolled_caret_coordinates_observed === true &&
    desktop.transformed_caret_coordinates_observed === true;
  const gates = [
    [
      'Core scope and independent review',
      core.criteria_reviewed === 19 &&
        ((core.scope_complete === true &&
          core.independent_review_completed === true) ||
          deferred('Core scope and independent review')),
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
      (ime.full_acceptance === true && ime.independent_acceptance === true &&
        ime.physical_input_method_acceptance === true &&
        ime.other_platform_native_ime_acceptance === true) ||
        (desktopAccepted && deferred('Physical and cross-platform IME')),
    ],
    [
      'Whole delivery acceptance',
      (delivery.whole_scope_acceptance === true ||
        deferred('Whole delivery acceptance')) &&
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
    console.log('PASS RmlUi publication gates with recorded release decisions');
  }
}

module.exports = {
  readEvidence, readCandidate, sourceFingerprint, publicationFailures,
};
