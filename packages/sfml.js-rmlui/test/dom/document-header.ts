import {
  Document, DocumentHeader, type DocumentHeaderInit,
  type DocumentHeaderSnapshot, type DocumentHeaderResource,
} from '../../src';

declare const document: Document;
const init: DocumentHeaderInit = {
  source: 'views/main.rml', title: 'Native header',
  templateResources: [ 'base.rml' ],
  rcss: [{ path: 'theme.rcss' }],
  scripts: [{ content: 'state = 1;', isInline: true, line: 5 }],
};
const header = new DocumentHeader(init);
const snapshot: DocumentHeaderSnapshot = header.snapshot();
const resources: DocumentHeaderResource[] = header.rcss;
header.title = 'New title';
header.source = 'new.rml';
header.rcss = resources;
header.scripts = [{ path: 'main.js' }];
header.templateResources = [ 'new-template.rml' ];
header.mergeHeader(new DocumentHeader());
header.templateResources = header.mergePaths(
  header.templateResources, [ 'extra.rml' ], header.source);
header.rcss = header.mergeResources(header.rcss, [{ path: 'extra.rcss' }]);
header.replace(snapshot);
document.processHeader(header);

// @ts-expect-error A document header requires native ownership.
document.processHeader(init);
// @ts-expect-error Resource line offsets are integers represented as numbers.
header.scripts = [{ line: '3' }];
// @ts-expect-error Inline flags are booleans.
header.rcss = [{ isInline: 1 }];
// @ts-expect-error Template resources are path strings.
header.templateResources = [ 3 ];
// @ts-expect-error Merge requires a header, not a snapshot.
header.mergeHeader(snapshot);
void [ snapshot, resources ];
