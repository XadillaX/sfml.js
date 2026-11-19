import {
  Factory, Element, ElementFormControlInput, StyleSheetContainer,
  StreamMemory, type Stream, type Context, type Document,
} from '../../src';

declare const parent: Element;
declare const stream: Stream;
declare const context: Context;
const document: Document | null = Factory.instanceDocumentStream(
  context, stream, 'body');
const detached: Element | null = Factory.instanceElement(
  parent, 'input', 'custom', { type: 'text', exact: 4n });
const empty: Element | null = Factory.instanceElement(null, 'div', 'div');
const textParsed: boolean = Factory.instanceElementText(parent, 'text');
const streamParsed: boolean = Factory.instanceElementStream(
  parent, new StreamMemory());
const strings: StyleSheetContainer | null =
  Factory.instanceStyleSheetString('');
const files: StyleSheetContainer | null = Factory.instanceStyleSheetFile('x');
const streams: StyleSheetContainer | null =
  Factory.instanceStyleSheetStream(stream);
const names: string[] = Factory.getStructuralDataViewAttributeNames();
const structural: boolean = Factory.isStructuralDataView('for');
Factory.clearStyleSheetCache();
Factory.clearTemplateCache();
if (detached instanceof ElementFormControlInput) {
  detached.setValue('typed');
}

// @ts-expect-error Factory elements use native instancer names.
Factory.instanceElement(parent, 4, 'div');
Factory.instanceElement(parent, 'div', 'div', { pointer: parent });
// @ts-expect-error Text instancing requires a parent element.
Factory.instanceElementText(null, 'text');
// @ts-expect-error Factory stream operations require owned native streams.
Factory.instanceStyleSheetStream({});
// @ts-expect-error Native instancing can fail and return null.
const required: Element = Factory.instanceElement(parent, 'div', 'div');
// @ts-expect-error A document needs an actual native context.
Factory.instanceDocumentStream(parent, stream, 'body');
// @ts-expect-error The document base tag is required by native Factory.
Factory.instanceDocumentStream(context, stream);
// @ts-expect-error Document creation may fail.
const requiredDocument: Document =
  Factory.instanceDocumentStream(context, stream, 'body');

void [
  detached, empty, textParsed, streamParsed, strings, files, streams, names,
  structural, required, document, requiredDocument,
];
