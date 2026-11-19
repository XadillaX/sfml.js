import {
  Context, Document, Element, ModalFlag, FocusFlag, ScrollFlag, ScrollBehavior,
} from '../../src';

declare const context: Context;
declare const document: Document;
declare const element: Element;

const created: Document | null = context.createDocument();
const found: Document | null = context.getDocument('id');
const indexed: Document | null = context.getDocument(0);
const count: number = context.getNumDocuments();
const owner: Context | null = document.getContext();
const modal: boolean = document.isModal();
const tab: Element | null = document.findNextTabElement(element, true, false);
const hovered: Element | null = context.getHoverElement();
const focused: Element | null = context.getFocusElement();
const hit: Element | null = context.getElementAtPoint(
  { x: 3.5, y: 20 }, null, document);
const baseTag: string = context.getDocumentsBaseTag();

context.setDocumentsBaseTag('html');
context.setDefaultScrollBehavior(ScrollBehavior.Smooth, 2);
context.pullDocumentToFront(document);
context.pushDocumentToBack(document);
context.unfocusDocument(document);
context.unloadDocument(document);
context.unloadAllDocuments();
document.show();
document.show(true);
document.show(ModalFlag.Keep, FocusFlag.Keep, ScrollFlag.None);
document.pullToFront();
document.pushToBack();
document.updateDocument();
document.hide();
document.close();
document.unload();

// @ts-expect-error Unknown flags are not part of the enum.
document.show(3);
// @ts-expect-error Focus flags are not booleans.
document.show(false, true);
// @ts-expect-error Coordinates must be numeric.
context.getElementAtPoint({ x: '1', y: 2 });
// @ts-expect-error Context owns documents, not arbitrary elements.
context.unloadDocument(element);
// @ts-expect-error A starting element is required.
document.findNextTabElement(null, true);
// @ts-expect-error Hide has no modal flags.
document.hide(ModalFlag.Modal);
// @ts-expect-error Close does not accept another document.
document.close(document);

void [ created, found, indexed, count, owner, modal, tab, hovered, focused,
  hit, baseTag ];
