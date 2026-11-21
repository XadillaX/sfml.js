'use strict';

const assert = require('node:assert/strict');
const {
  readEvidence, publicationFailures,
} = require('../../tools/testing/verify-publication.cjs');

const actual = readEvidence();
const unapproved = structuredClone(actual);
delete unapproved.releaseDecision;
const actualFailures = publicationFailures(unapproved);
for (const name of [
  'Core scope and independent review',
  'Physical and cross-platform IME',
  'Whole delivery acceptance',
]) {
  assert.ok(actualFailures.includes(name), name);
}
for (const name of [
  '113 VisualTests positive content',
  'VisualTests live interactions',
]) {
  assert.ok(!actualFailures.includes(name), name);
}
console.log('PASS publication-unapproved-incomplete-evidence-is-rejected');

const candidate = { version: '1.3.0', sourceFingerprint: 'a'.repeat(64) };
const approved = structuredClone(actual);
approved.releaseDecision = {
  accepted_by_user: true,
  version: candidate.version,
  source_fingerprint: candidate.sourceFingerprint,
  deferred_gates: [
    'Core scope and independent review',
    'Physical and cross-platform IME',
    'Whole delivery acceptance',
  ],
};
assert.deepEqual(publicationFailures(approved, candidate), []);
console.log('PASS publication-current-release-user-decision-is-honored');

assert.ok(publicationFailures(approved, {
  ...candidate, version: '1.3.1',
}).length > 0);
console.log('PASS publication-patch-release-requires-its-own-decision');

for (const mutate of [
  evidence => {
    delete evidence.releaseDecision;
  },
  evidence => {
    evidence.releaseDecision.accepted_by_user = false;
  },
  evidence => {
    evidence.releaseDecision.version = '1.4.0';
  },
  evidence => {
    evidence.releaseDecision.source_fingerprint = 'b'.repeat(64);
  },
  evidence => {
    evidence.releaseDecision.deferred_gates.pop();
  },
  evidence => {
    evidence.desktop.accepted_by_user = false;
  },
  evidence => {
    evidence.desktop.actual_engine_chinese_commit_observed = false;
  },
  evidence => {
    evidence.core.criteria_reviewed = 0;
  },
  evidence => {
    evidence.delivery.editor.host_contracts = 0;
  },
  evidence => {
    evidence.delivery.documentation.rmlui_browser.passed = false;
  },
  evidence => {
    evidence.visual.pages[0].referenceFrames[0]
      .pixelComparison.maxChannelDifference = 2;
  },
  evidence => {
    evidence.interactions.pages[0].frames[0].pixels.differentPixels = 1;
  },
]) {
  const evidence = structuredClone(approved);
  mutate(evidence);
  assert.ok(publicationFailures(evidence, candidate).length > 0);
}
console.log('PASS publication-approval-keeps-release-and-measurement-gates');

const accepted = structuredClone(unapproved);
Object.assign(accepted.core, {
  scope_complete: true, independent_review_completed: true,
});
Object.assign(accepted.ime, {
  full_acceptance: true, independent_acceptance: true,
  physical_input_method_acceptance: true,
  other_platform_native_ime_acceptance: true,
});
accepted.delivery.whole_scope_acceptance = true;
accepted.delivery.documentation.rmlui_browser = {
  passed: true, page_count: 1920, viewport_count: 3,
};
assert.deepEqual(publicationFailures(accepted), []);
console.log('PASS publication-measured-parity-retains-eight-upstream-failures');

const mutations = [
  evidence => {
    evidence.core.independent_review_completed = false;
  },
  evidence => {
    evidence.visual.summary.positivePass = 112;
  },
  evidence => {
    evidence.visual.summary.positiveFail = 1;
  },
  evidence => {
    evidence.visual.summary.nativePositivePass = 0;
  },
  evidence => {
    evidence.visual.pages[0].contentResults.sfml = {
      status: 'fail',
      failure: {
        type: 'AssertionError', message: 'binding regression', stack: [],
      },
    };
  },
  evidence => {
    delete evidence.visual.pages[0].contentResults.gl3;
  },
  evidence => {
    evidence.visual.pages[0].referenceFrames = [];
  },
  evidence => {
    evidence.visual.pages.find(row => row.contentStatus === 'fail')
      .referenceFrames[0].pixelComparison.pass = false;
  },
  evidence => {
    evidence.visual.pages.find(row => row.contentStatus === 'fail')
      .referenceFrames[0].maxLayoutDifference = 1;
  },
  evidence => {
    const row = evidence.visual.pages.find(row => row.contentStatus === 'fail');
    row.sha256 = '0'.repeat(64);
  },
  evidence => {
    evidence.visual.pages.find(row => row.contentStatus === 'fail')
      .contentResults.gl3 = {
        status: 'pass', assertions: [ 'upstream succeeds' ],
      };
  },
  evidence => {
    evidence.visual.pages.find(row => row.contentStatus === 'fail')
      .contentResults.sfml.failure.stack.at(-1).line += 1;
  },
  evidence => {
    evidence.visual.pages.pop();
  },
  evidence => {
    evidence.visual.pages[1] = structuredClone(evidence.visual.pages[0]);
  },
  evidence => {
    evidence.interactions.summary.fail = 1;
  },
  evidence => {
    evidence.interactions.pages.find(row => row.status === 'fail')
      .frames[0].pixels.differentPixels = 1;
  },
  evidence => {
    evidence.interactions.pages.find(row => row.status === 'fail')
      .interactionResults.gl3 = {
        status: 'pass', assertions: [ 'upstream succeeds' ],
      };
  },
  evidence => {
    evidence.interactions.pages[0].frames = [];
  },
  evidence => {
    evidence.ime.physical_input_method_acceptance = false;
  },
  evidence => {
    evidence.ime.other_platform_native_ime_acceptance = false;
  },
  evidence => {
    evidence.delivery.whole_scope_acceptance = false;
  },
  evidence => {
    evidence.delivery.documentation.rmlui_browser.passed = false;
  },
];
for (const mutate of mutations) {
  const evidence = structuredClone(accepted);
  mutate(evidence);
  assert.ok(publicationFailures(evidence).length > 0);
}
console.log(`PASS publication-${mutations.length}-evidence-mutations-rejected`);

const missingInput = structuredClone(accepted);
const report = missingInput.interactions;
const removed = report.pages.find(row => row.name === 'acid1');
report.pages = report.pages.filter(row => row.name !== removed.name);
report.originalSourceCoverage.covered =
  report.originalSourceCoverage.covered.filter(name => name !== removed.name);
report.originalSourceCoverage.required =
  report.originalSourceCoverage.required.filter(name => name !== removed.name);
report.summary.pages -= 1;
report.summary.pass -= 1;
report.summary.frames -= removed.frames.length;
report.summary.byteExactFrames -= removed.frames.length;
report.summary.requiredInteractivePages -= 1;
assert.ok(publicationFailures(missingInput)
  .includes('VisualTests live interactions'));
console.log('PASS publication-forged-complete-input-coverage-is-rejected');
